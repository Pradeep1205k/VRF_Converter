from pathlib import Path
from typing import Optional, Tuple

from PIL import Image as PilImage

from app.services.storage import (
    IMAGE_CONVERTED_DIR,
    IMAGE_ORIGINALS_DIR,
    ensure_storage_dirs,
)


def get_image_info(path: str) -> Optional[str]:
    with PilImage.open(path) as image:
        return f"{image.width}x{image.height}"


def save_image_upload(upload_path: str, filename: str) -> str:
    ensure_storage_dirs()
    storage_name = f"{Path(filename).stem}{Path(upload_path).suffix}"
    destination = IMAGE_ORIGINALS_DIR / storage_name
    Path(upload_path).replace(destination)
    return str(destination)


def convert_image(
    input_path: str,
    conversion_id: int,
    target_format: str,
    target_resolution: Optional[str],
    quality: Optional[int],
) -> Tuple[str, Optional[str]]:
    ensure_storage_dirs()
    output_path = IMAGE_CONVERTED_DIR / f"{conversion_id}.{target_format}"
    try:
        with PilImage.open(input_path) as image:
            if target_resolution:
                width_str, height_str = target_resolution.lower().split("x")
                image = image.resize((int(width_str), int(height_str)), PilImage.LANCZOS)
            save_kwargs = {}
            if quality:
                save_kwargs["quality"] = max(10, min(int(quality), 95))
            format_name = target_format.upper()
            if target_format.lower() in {"jpg", "jpeg"}:
                format_name = "JPEG"
                save_kwargs["quality"] = save_kwargs.get("quality", 85)
                image = image.convert("RGB")
            image.save(output_path, format=format_name, **save_kwargs)
        return str(output_path), None
    except Exception as exc:
        return "", str(exc)
