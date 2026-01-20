# Video Manipulator

Web-based video conversion platform built with FastAPI, FFmpeg, React, and Tailwind.

## Features
- Upload videos (mp4, mkv, webm, avi, mov)
- Convert format, resolution, bitrate, FPS, codec
- Preview original or converted output
- Download converted videos
- JWT authentication with access + refresh tokens
- Conversion history per user
- Thumbnail + 5s preview clip generation

## Project Structure
```
video-manipulator/
+-- backend/
¦   +-- app/
¦   +-- requirements.txt
¦   +-- Dockerfile
+-- frontend/
¦   +-- src/
¦   +-- public/
¦   +-- vite.config.js
+-- README.md
+-- docker-compose.yml
```

## Local Setup

### Backend
1) Install FFmpeg
2) Create a virtualenv and install deps:
```bash
cd backend
python -m venv .venv
. .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```
3) Create `.env`:
```bash
cp .env.example .env
```
4) Run the API:
```bash
uvicorn app.main:app --reload
```

API docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Open: `http://localhost:5173`

## Docker (optional)
```bash
docker compose up --build
```

## Environment Variables
Backend (`backend/.env`):
- `SECRET_KEY`
- `DATABASE_URL`
- `STORAGE_DIR`
- `MAX_UPLOAD_MB`
- `ALLOWED_MIME_TYPES`
- `RATE_LIMIT_PER_MINUTE`

Frontend (`frontend/.env`):
- `VITE_API_URL`

## API Summary
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `POST /api/video/upload`
- `POST /api/video/upload/chunk`
- `POST /api/video/upload/complete`
- `POST /api/video/convert`
- `GET /api/video/list`
- `GET /api/video/history`
- `GET /api/video/status/{conversion_id}`
- `GET /api/video/preview/{video_id}`
- `GET /api/video/download/{video_id}`
- `GET /api/video/thumbnail/{video_id}`

## Deployment
- Frontend: build with `npm run build` and deploy `frontend/dist` to GitHub Pages
- Backend: Docker-ready, deploy to Render/Railway/EC2

## Notes
- JWTs are stored client-side; for production, prefer httpOnly cookies and HTTPS.
- FFmpeg must be available on the backend host.
# VRF_Converter
