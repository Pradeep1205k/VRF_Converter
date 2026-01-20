from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Conversion(Base):
    __tablename__ = "conversions"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_format = Column(String, nullable=False)
    target_resolution = Column(String, nullable=True)
    target_bitrate = Column(String, nullable=True)
    target_fps = Column(String, nullable=True)
    target_codec = Column(String, nullable=True)
    status = Column(String, default="queued")
    progress = Column(Integer, default=0)
    output_path = Column(String, nullable=True)
    download_url = Column(String, nullable=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    video = relationship("Video", back_populates="conversions")
    owner = relationship("User", back_populates="conversions")
