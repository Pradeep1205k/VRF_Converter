import time
from typing import Dict, List

from fastapi import HTTPException, Request, status

from app.core.config import settings

_rate_store: Dict[str, List[float]] = {}


def enforce_rate_limit(request: Request) -> None:
    limit = settings.rate_limit_per_minute
    if limit <= 0:
        return
    now = time.time()
    window_start = now - 60
    client_ip = request.client.host if request.client else "unknown"
    timestamps = _rate_store.get(client_ip, [])
    timestamps = [ts for ts in timestamps if ts >= window_start]
    if len(timestamps) >= limit:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")
    timestamps.append(now)
    _rate_store[client_ip] = timestamps
