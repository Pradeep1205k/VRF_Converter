from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, constr


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    email: EmailStr
    password: constr(min_length=8, max_length=72)


class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        orm_mode = True


class VideoOut(BaseModel):
    id: int
    original_filename: str
    original_format: str
    original_resolution: Optional[str]
    file_size: int
    thumbnail_path: Optional[str]
    preview_path: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


class ImageOut(BaseModel):
    id: int
    original_filename: str
    original_format: str
    original_resolution: Optional[str]
    file_size: int
    created_at: datetime

    class Config:
        orm_mode = True


class ImageConversionCreate(BaseModel):
    image_id: int
    target_format: str
    target_resolution: Optional[str] = None
    quality: Optional[int] = None


class ImageConversionOut(BaseModel):
    id: int
    image_id: int
    target_format: str
    target_resolution: Optional[str]
    quality: Optional[int]
    status: str
    progress: int
    output_path: Optional[str]
    download_url: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


class ImageHistoryItem(BaseModel):
    image: ImageOut
    conversion: ImageConversionOut


class ConversionCreate(BaseModel):
    video_id: int
    target_format: str
    target_resolution: Optional[str] = None
    target_bitrate: Optional[str] = None
    target_fps: Optional[str] = None
    target_codec: Optional[str] = None
    keep_audio: bool = True
    clean_metadata: bool = False


class ConversionOut(BaseModel):
    id: int
    video_id: int
    target_format: str
    target_resolution: Optional[str]
    target_bitrate: Optional[str]
    target_fps: Optional[str]
    target_codec: Optional[str]
    status: str
    progress: int
    output_path: Optional[str]
    download_url: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True


class HistoryItem(BaseModel):
    video: VideoOut
    conversion: ConversionOut
