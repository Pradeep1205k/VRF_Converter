import os
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_current_user_optional, get_db, get_user_from_token
from app.core.config import settings
from app.models.conversion import Conversion
from app.models.user import User
from app.models.video import Video
from app.schemas.schemas import ConversionCreate, ConversionOut, HistoryItem, VideoOut
from app.services.conversion import run_conversion_with_progress
from app.services.ffmpeg import ensure_ffmpeg_tools, generate_preview_clip, generate_thumbnail, get_video_info
from app.services.rate_limit import enforce_rate_limit
from app.services.storage import assemble_chunks, safe_filename, save_chunk, save_upload_file
from app.db.session import SessionLocal

router = APIRouter(prefix="/video", tags=["video"])


ALLOWED_FORMATS = {"mp4", "mkv", "webm", "avi", "mov"}
ALLOWED_MIME = {mime.strip() for mime in settings.allowed_mime_types.split(",")}


def _resolve_user(
    token: Optional[str], db: Session, header_user: Optional[User]
) -> User:
    if token:
        return get_user_from_token(token, db)
    if header_user:
        return header_user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")


def _validate_upload(file: UploadFile) -> None:
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported MIME type")
    ext = Path(file.filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file format")


def _ensure_size(size_bytes: int, file_path: Optional[str] = None) -> None:
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if size_bytes > max_bytes:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")


def _update_video_assets(video_id: int, original_path: str) -> None:
    db = SessionLocal()
    try:
        thumbnail = generate_thumbnail(original_path, video_id)
        preview = generate_preview_clip(original_path, video_id)
        video = db.query(Video).filter(Video.id == video_id).first()
        if video:
            video.thumbnail_path = thumbnail
            video.preview_path = preview
            db.commit()
    finally:
        db.close()


@router.post("/upload", response_model=VideoOut)
async def upload_video(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enforce_rate_limit(request)
    _validate_upload(file)
    original_path, size = await save_upload_file(file)
    _ensure_size(size, original_path)
    try:
        ensure_ffmpeg_tools()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"FFmpeg not installed: {exc}",
        )
    resolution, _ = get_video_info(original_path)
    video = Video(
        user_id=current_user.id,
        original_filename=file.filename,
        original_format=Path(file.filename).suffix.lower().lstrip("."),
        original_resolution=resolution,
        file_size=size,
        original_path=original_path,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    background_tasks.add_task(_update_video_assets, video.id, original_path)
    return video


@router.post("/upload/chunk")
async def upload_chunk(
    request: Request,
    upload_id: str = Form(...),
    chunk_index: int = Form(...),
    chunk: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    enforce_rate_limit(request)
    await save_chunk(upload_id, chunk_index, chunk)
    return {"upload_id": upload_id, "chunk_index": chunk_index}


@router.post("/upload/complete", response_model=VideoOut)
async def complete_chunked_upload(
    request: Request,
    upload_id: str = Form(...),
    original_filename: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    enforce_rate_limit(request)
    ext = Path(original_filename).suffix.lower().lstrip(".")
    if ext not in ALLOWED_FORMATS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file format")
    original_path, size = assemble_chunks(upload_id, original_filename)
    _ensure_size(size, original_path)
    resolution, _ = get_video_info(original_path)
    video = Video(
        user_id=current_user.id,
        original_filename=original_filename,
        original_format=ext,
        original_resolution=resolution,
        file_size=size,
        original_path=original_path,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    background_tasks.add_task(_update_video_assets, video.id, original_path)
    return video


def _conversion_task(conversion_id: int, payload: ConversionCreate) -> None:
    db = SessionLocal()
    try:
        conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
        video = db.query(Video).filter(Video.id == payload.video_id).first()
        if not conversion or not video:
            return
        conversion.status = "processing"
        db.commit()

        def on_progress(progress: int) -> None:
            conversion.progress = progress
            db.commit()

        try:
            ensure_ffmpeg_tools()
        except FileNotFoundError as exc:
            conversion.status = "failed"
            conversion.error_message = f"FFmpeg not installed: {exc}"
            db.commit()
            return

        output_path = run_conversion_with_progress(
            video.original_path,
            conversion_id,
            payload.target_format,
            payload.target_resolution,
            payload.target_bitrate,
            payload.target_fps,
            payload.target_codec,
            payload.keep_audio,
            payload.clean_metadata,
            on_progress,
        )
        conversion.output_path = output_path
        conversion.download_url = f"/api/video/download/{video.id}?conversion_id={conversion_id}"
        conversion.status = "completed"
        conversion.progress = 100
        db.commit()
    except Exception as exc:
        conversion = db.query(Conversion).filter(Conversion.id == conversion_id).first()
        if conversion:
            conversion.status = "failed"
            conversion.error_message = str(exc)
            db.commit()
    finally:
        db.close()


@router.post("/convert", response_model=ConversionOut)
def convert_video(
    payload: ConversionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = db.query(Video).filter(Video.id == payload.video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if payload.target_format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported target format")
    conversion = Conversion(
        video_id=video.id,
        user_id=current_user.id,
        target_format=payload.target_format,
        target_resolution=payload.target_resolution,
        target_bitrate=payload.target_bitrate,
        target_fps=payload.target_fps,
        target_codec=payload.target_codec,
        status="queued",
        progress=0,
    )
    db.add(conversion)
    db.commit()
    db.refresh(conversion)
    background_tasks.add_task(_conversion_task, conversion.id, payload)
    return conversion


@router.get("/history", response_model=List[HistoryItem])
def history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversions = (
        db.query(Conversion)
        .filter(Conversion.user_id == current_user.id)
        .order_by(Conversion.created_at.desc())
        .all()
    )
    items = []
    for conversion in conversions:
        video = conversion.video
        if video:
            items.append({"video": video, "conversion": conversion})
    return items


@router.get("/list", response_model=List[VideoOut])
def list_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )


@router.get("/status/{conversion_id}", response_model=ConversionOut)
def conversion_status(
    conversion_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversion = (
        db.query(Conversion)
        .filter(Conversion.id == conversion_id, Conversion.user_id == current_user.id)
        .first()
    )
    if not conversion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not found")
    return conversion


@router.get("/preview/{video_id}")
def preview_video(
    video_id: int,
    conversion_id: Optional[int] = None,
    kind: str = "original",
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    current_user = _resolve_user(token, db, current_user)
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if kind == "converted":
        if not conversion_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="conversion_id required")
        conversion = (
            db.query(Conversion)
            .filter(Conversion.id == conversion_id, Conversion.user_id == current_user.id)
            .first()
        )
        if not conversion or not conversion.output_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not ready")
        return FileResponse(conversion.output_path, filename=safe_filename(conversion.output_path))
    if not video.preview_path or not os.path.exists(video.preview_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preview not ready")
    return FileResponse(video.preview_path, filename=safe_filename(video.preview_path))


@router.get("/download/{video_id}")
def download_video(
    video_id: int,
    conversion_id: Optional[int] = None,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    current_user = _resolve_user(token, db, current_user)
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    if conversion_id:
        conversion = (
            db.query(Conversion)
            .filter(Conversion.id == conversion_id, Conversion.user_id == current_user.id)
            .first()
        )
        if not conversion or not conversion.output_path:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversion not ready")
        return FileResponse(conversion.output_path, filename=safe_filename(conversion.output_path))
    return FileResponse(video.original_path, filename=video.original_filename)


@router.get("/thumbnail/{video_id}")
def thumbnail(
    video_id: int,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    current_user = _resolve_user(token, db, current_user)
    video = db.query(Video).filter(Video.id == video_id, Video.user_id == current_user.id).first()
    if not video or not video.thumbnail_path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thumbnail not ready")
    return FileResponse(video.thumbnail_path, filename=safe_filename(video.thumbnail_path))
