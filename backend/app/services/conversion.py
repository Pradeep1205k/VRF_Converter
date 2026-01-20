import re
from typing import Optional

from app.services.ffmpeg import convert_video, get_video_info

_TIME_RE = re.compile(r"time=(\d+):(\d+):(\d+\.\d+)")


def parse_ffmpeg_time(line: str) -> Optional[float]:
    match = _TIME_RE.search(line)
    if not match:
        return None
    hours = int(match.group(1))
    minutes = int(match.group(2))
    seconds = float(match.group(3))
    return hours * 3600 + minutes * 60 + seconds


def run_conversion_with_progress(
    input_path: str,
    conversion_id: int,
    target_format: str,
    target_resolution: Optional[str],
    target_bitrate: Optional[str],
    target_fps: Optional[str],
    target_codec: Optional[str],
    keep_audio: bool,
    clean_metadata: bool,
    on_progress,
) -> str:
    _, duration = get_video_info(input_path)
    output_path, process = convert_video(
        input_path,
        conversion_id,
        target_format,
        target_resolution,
        target_bitrate,
        target_fps,
        target_codec,
        keep_audio,
        clean_metadata,
    )
    if process.stdout is None:
        process.wait()
        return output_path

    for line in process.stdout:
        timestamp = parse_ffmpeg_time(line)
        if timestamp is not None and duration and duration > 0:
            progress = min(int((timestamp / duration) * 100), 99)
            on_progress(progress)
    process.wait()
    return output_path
