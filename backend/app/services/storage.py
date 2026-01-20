import os
import uuid
from pathlib import Path
from typing import Tuple

from fastapi import UploadFile

from app.core.config import settings


STORAGE_ROOT = Path(settings.storage_dir)
ORIGINALS_DIR = STORAGE_ROOT / "originals"
CONVERTED_DIR = STORAGE_ROOT / "converted"
PREVIEWS_DIR = STORAGE_ROOT / "previews"
THUMBNAILS_DIR = STORAGE_ROOT / "thumbnails"
CHUNKS_DIR = STORAGE_ROOT / "chunks"
IMAGE_ORIGINALS_DIR = STORAGE_ROOT / "images" / "originals"
IMAGE_CONVERTED_DIR = STORAGE_ROOT / "images" / "converted"


def ensure_storage_dirs() -> None:
    for directory in [
        ORIGINALS_DIR,
        CONVERTED_DIR,
        PREVIEWS_DIR,
        THUMBNAILS_DIR,
        CHUNKS_DIR,
        IMAGE_ORIGINALS_DIR,
        IMAGE_CONVERTED_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def generate_storage_name(filename: str) -> str:
    ext = Path(filename).suffix
    return f"{uuid.uuid4().hex}{ext}"


async def save_upload_file_to_dir(upload_file: UploadFile, directory: Path) -> Tuple[str, int]:
    ensure_storage_dirs()
    storage_name = generate_storage_name(upload_file.filename)
    destination = directory / storage_name
    size = 0
    with destination.open("wb") as buffer:
        while True:
            chunk = await upload_file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            buffer.write(chunk)
    return str(destination), size


async def save_upload_file(upload_file: UploadFile) -> Tuple[str, int]:
    return await save_upload_file_to_dir(upload_file, ORIGINALS_DIR)


async def save_chunk(upload_id: str, chunk_index: int, chunk: UploadFile) -> str:
    ensure_storage_dirs()
    upload_dir = CHUNKS_DIR / upload_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    chunk_path = upload_dir / f"{chunk_index}.part"
    with chunk_path.open("wb") as buffer:
        while True:
            data = await chunk.read(1024 * 1024)
            if not data:
                break
            buffer.write(data)
    return str(chunk_path)


def assemble_chunks(upload_id: str, original_filename: str) -> Tuple[str, int]:
    ensure_storage_dirs()
    upload_dir = CHUNKS_DIR / upload_id
    if not upload_dir.exists():
        raise FileNotFoundError("Upload not found")
    storage_name = generate_storage_name(original_filename)
    destination = ORIGINALS_DIR / storage_name
    size = 0
    with destination.open("wb") as output:
        for part in sorted(upload_dir.iterdir(), key=lambda p: int(p.stem)):
            with part.open("rb") as input_file:
                while True:
                    data = input_file.read(1024 * 1024)
                    if not data:
                        break
                    size += len(data)
                    output.write(data)
    for part in upload_dir.iterdir():
        part.unlink()
    upload_dir.rmdir()
    return str(destination), size


def safe_filename(path: str) -> str:
    return os.path.basename(path)
