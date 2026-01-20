from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, video, image
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.services.storage import ensure_storage_dirs

app = FastAPI(title=settings.app_name)

# ✅ CORS — REQUIRED for GitHub Pages + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://pradeep1205k.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Startup tasks
@app.on_event("startup")
def startup_event() -> None:
    ensure_storage_dirs()
    # Import models so SQLAlchemy registers tables before create_all
    from app.db import models  # noqa: F401
    Base.metadata.create_all(bind=engine)

# ✅ API routes
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(video.router, prefix=settings.api_v1_prefix)
app.include_router(image.router, prefix=settings.api_v1_prefix)
