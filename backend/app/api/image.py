from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional, get_db, get_user_from_token
from app.models.image import Image
from app.models.image_conversion import ImageConversion
from app.models.user import User
from app.schemas.schemas import ImageConversionCreate, ImageConversionOut, ImageHistoryItem, ImageOut
from app.services.image import convert_image, get_image_info
from app.services.rate_limit import enforce_rate_limit
from app.services.storage import IMAGE_ORIGINALS_DIR, save_upload_file_to_dir, safe_filename
from app.db.session import SessionLocal

router = APIRouter(prefix="/image", tags=["images"])

ALLOWED_IMAGE_FORMATS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}


def _resolve_user(token: Optional[str], db: Session, header_user: Optional[User]) -> User:
    if token:
        return get_user_from_token(token, db)
    if header_user:
        return header_user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def _validate_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image MIME type")
    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")


@router.post("/upload", response_model=ImageOut)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enforce_rate_limit(request)
    _validate_upload(file)
    original_path, size = await save_upload_file_to_dir(file, IMAGE_ORIGINALS_DIR)
    resolution = get_image_info(original_path)
    image = Image(
        user_id=current_user.id,
        original_filename=file.filename,
        original_format=Path(file.filename).suffix.lower().lstrip("."),
        original_resolution=resolution,
        file_size=size,
        original_path=original_path,
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


def _conversion_task(conversion_id: int, payload: ImageConversionCreate) -> None:
    db = SessionLocal()
    try:
        conversion = db.query(ImageConversion).filter(ImageConversion.id == conversion_id).first()
        image = db.query(Image).filter(Image.id == payload.image_id).first()
        if not conversion or not image:
            return
        conversion.status = "processing"
        db.commit()
        output_path, error = convert_image(
            image.original_path,
            conversion_id,
            payload.target_format,
            payload.target_resolution,
            payload.quality,
        )
        if error:
            conversion.status = "failed"
            conversion.error_message = error
            db.commit()
            return
        conversion.output_path = output_path
        conversion.download_url = f"/api/image/download/{image.id}?conversion_id={conversion_id}"
        conversion.status = "completed"
        conversion.progress = 100
        db.commit()
    except Exception as exc:
        conversion = db.query(ImageConversion).filter(ImageConversion.id == conversion_id).first()
        if conversion:
            conversion.status = "failed"
            conversion.error_message = str(exc)
            db.commit()
    finally:
        db.close()


@router.post("/convert", response_model=ImageConversionOut)
def convert_image_api(
    payload: ImageConversionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image = db.query(Image).filter(Image.id == payload.image_id, Image.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    if payload.target_format not in ALLOWED_IMAGE_FORMATS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported target format")
    conversion = ImageConversion(
        image_id=image.id,
        user_id=current_user.id,
        target_format=payload.target_format,
        target_resolution=payload.target_resolution,
        quality=payload.quality,
        status="queued",
        progress=0,
    )
    db.add(conversion)
    db.commit()
    db.refresh(conversion)
    background_tasks.add_task(_conversion_task, conversion.id, payload)
    return conversion


@router.get("/list", response_model=List[ImageOut])
def list_images(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Image)
        .filter(Image.user_id == current_user.id)
        .order_by(Image.created_at.desc())
        .all()
    )


@router.get("/history", response_model=List[ImageHistoryItem])
def history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversions = (
        db.query(ImageConversion)
        .filter(ImageConversion.user_id == current_user.id)
        .order_by(ImageConversion.created_at.desc())
        .all()
    )
    items = []
    for conversion in conversions:
        image = conversion.image
        if image:
            items.append({"image": image, "conversion": conversion})
    return items


@router.get("/status/{conversion_id}", response_model=ImageConversionOut)
def conversion_status(
    conversion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversion = (
        db.query(ImageConversion)
        .filter(ImageConversion.id == conversion_id, ImageConversion.user_id == current_user.id)
        .first()
    )
    if not conversion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not found")
    return conversion


@router.get("/preview/{image_id}")
def preview_image(
    image_id: int,
    conversion_id: Optional[int] = None,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    current_user = _resolve_user(token, db, current_user)
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    if conversion_id:
        conversion = (
            db.query(ImageConversion)
            .filter(ImageConversion.id == conversion_id, ImageConversion.user_id == current_user.id)
            .first()
        )
        if not conversion or not conversion.output_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not ready")
        return FileResponse(conversion.output_path, filename=safe_filename(conversion.output_path))
    return FileResponse(image.original_path, filename=image.original_filename)


@router.get("/download/{image_id}")
def download_image(
    image_id: int,
    conversion_id: Optional[int] = None,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    current_user = _resolve_user(token, db, current_user)
    image = db.query(Image).filter(Image.id == image_id, Image.user_id == current_user.id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    if conversion_id:
        conversion = (
            db.query(ImageConversion)
            .filter(ImageConversion.id == conversion_id, ImageConversion.user_id == current_user.id)
            .first()
        )
        if not conversion or not conversion.output_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not ready")
        return FileResponse(conversion.output_path, filename=safe_filename(conversion.output_path))
    return FileResponse(image.original_path, filename=image.original_filename)
