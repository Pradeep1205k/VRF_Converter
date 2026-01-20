from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    original_filename = Column(String, nullable=False)
    original_format = Column(String, nullable=False)
    original_resolution = Column(String, nullable=True)
    file_size = Column(Integer, nullable=False)
    original_path = Column(String, nullable=False)
    thumbnail_path = Column(String, nullable=True)
    preview_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="videos")
    conversions = relationship("Conversion", back_populates="video")
