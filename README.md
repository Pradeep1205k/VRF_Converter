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
│   +-- app/
│   +-- requirements.txt
│   +-- Dockerfile
+-- frontend/
│   +-- src/
│   +-- public/
│   +-- vite.config.js
+-- README.md
+-- docker-compose.yml
```

## Local Setup

### Backend

#### 1. Install FFmpeg

**Option A: Manual Download (Recommended for Windows)**
- Download from https://ffmpeg.org/download.html (Windows build)
- Extract to `C:\ffmpeg`
- Add `C:\ffmpeg\bin` to system PATH:
  - Right-click "This PC" → Properties → Advanced system settings → Environment Variables
  - Add `C:\ffmpeg\bin` to PATH
- Verify: Open new PowerShell and run `ffmpeg -version`

**Option B: Chocolatey (requires admin)**
```powershell
# Run PowerShell as Administrator
choco install ffmpeg
```

#### 2. Create Virtual Environment & Install Dependencies

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate  # Windows PowerShell
pip install -r requirements.txt
```

#### 3. Create `.env` File

```bash
cp .env.example .env
```

#### 4. Run the API

```bash
python -m uvicorn app.main:app --reload
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

### Backend (Render)
1. Go to https://render.com → New → Web Service
2. Connect GitHub repo, set Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. Set environment variables (see above)
6. Add FFmpeg in build steps (buildpack or init script)

### Frontend (GitHub Pages)
```bash
cd frontend
npm install
npm run build
npm install --save-dev gh-pages
```

Update `package.json`:
```json
{
  "homepage": "https://<username>.github.io/<repo>",
  "scripts": {
    "deploy": "gh-pages -d dist"
  }
}
```

Deploy:
```bash
npm run build
npm run deploy
```

Then set source to `gh-pages` branch in GitHub → Settings → Pages.

## Notes
- JWTs are stored client-side; for production, use httpOnly cookies and HTTPS.
- FFmpeg must be available on the backend host.
- On Windows, use `python -m uvicorn` if `uvicorn` command is not found.
