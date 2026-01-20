import json
import shutil
import subprocess
from pathlib import Path
from typing import Optional, Tuple

from app.services.storage import CONVERTED_DIR, PREVIEWS_DIR, THUMBNAILS_DIR, ensure_storage_dirs


def _run_command(command: list) -> subprocess.CompletedProcess:
    return subprocess.run(command, capture_output=True, text=True, check=False)


def ensure_ffmpeg_tools() -> None:
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if missing:
        raise FileNotFoundError(f"Missing tools: {', '.join(missing)}")


def get_video_info(path: str) -> Tuple[Optional[str], Optional[float]]:
    ensure_ffmpeg_tools()
    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration:format=duration",
        "-of",
        "json",
        path,
    ]
    result = _run_command(command)
    if result.returncode != 0:
        return None, None
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    if not streams:
        return None, None
    stream = streams[0]
    width = stream.get("width")
    height = stream.get("height")
    duration = stream.get("duration")
    if not duration:
        format_info = data.get("format", {})
        duration = format_info.get("duration")
    resolution = f"{width}x{height}" if width and height else None
    duration_seconds = float(duration) if duration else None
    return resolution, duration_seconds


def generate_thumbnail(input_path: str, video_id: int) -> Optional[str]:
    ensure_ffmpeg_tools()
    ensure_storage_dirs()
    output_path = THUMBNAILS_DIR / f"{video_id}.jpg"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-ss",
        "00:00:01.000",
        "-vframes",
        "1",
        str(output_path),
    ]
    result = _run_command(command)
    return str(output_path) if result.returncode == 0 else None


def generate_preview_clip(input_path: str, video_id: int) -> Optional[str]:
    ensure_ffmpeg_tools()
    ensure_storage_dirs()
    output_path = PREVIEWS_DIR / f"{video_id}.mp4"
    command = [
        "ffmpeg",
        "-y",
        "-i",
        input_path,
        "-t",
        "5",
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-movflags",
        "+faststart",
        str(output_path),
    ]
    result = _run_command(command)
    return str(output_path) if result.returncode == 0 else None


def build_conversion_command(
    input_path: str,
    output_path: str,
    target_format: str,
    target_resolution: Optional[str],
    target_bitrate: Optional[str],
    target_fps: Optional[str],
    target_codec: Optional[str],
    keep_audio: bool,
    clean_metadata: bool,
) -> list:
    format_defaults = {
        "mp4": {"video": "libx264", "audio": "aac", "pix_fmt": "yuv420p"},
        "mov": {"video": "libx264", "audio": "aac", "pix_fmt": "yuv420p"},
        "mkv": {"video": "libx264", "audio": "aac", "pix_fmt": "yuv420p"},
        "avi": {"video": "libx264", "audio": "aac", "pix_fmt": "yuv420p"},
        "webm": {"video": "libvpx-vp9", "audio": "libopus", "pix_fmt": None},
    }
    defaults = format_defaults.get(target_format, {"video": None, "audio": None, "pix_fmt": None})
    command = ["ffmpeg", "-y", "-i", input_path]
    if target_resolution:
        command += ["-vf", f"scale={target_resolution}"]
    if target_fps:
        command += ["-r", target_fps]
    if target_bitrate:
        command += ["-b:v", target_bitrate]
    if target_codec:
        command += ["-c:v", target_codec]
    elif defaults["video"]:
        command += ["-c:v", defaults["video"]]
    if defaults["pix_fmt"]:
        command += ["-pix_fmt", defaults["pix_fmt"]]
    if not keep_audio:
        command += ["-an"]
    elif defaults["audio"]:
        command += ["-c:a", defaults["audio"]]
    if clean_metadata:
        command += ["-map_metadata", "-1"]
    if target_format in {"mp4", "mov"}:
        command += ["-movflags", "+faststart"]
    command += [output_path]
    return command


def convert_video(
    input_path: str,
    conversion_id: int,
    target_format: str,
    target_resolution: Optional[str],
    target_bitrate: Optional[str],
    target_fps: Optional[str],
    target_codec: Optional[str],
    keep_audio: bool,
    clean_metadata: bool,
) -> Tuple[str, subprocess.Popen]:
    ensure_ffmpeg_tools()
    ensure_storage_dirs()
    output_path = CONVERTED_DIR / f"{conversion_id}.{target_format}"
    command = build_conversion_command(
        input_path,
        str(output_path),
        target_format,
        target_resolution,
        target_bitrate,
        target_fps,
        target_codec,
        keep_audio,
        clean_metadata,
    )
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    return str(output_path), process
