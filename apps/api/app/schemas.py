from pydantic import BaseModel, Field
from typing import List, Tuple, Optional
from datetime import datetime

class Point(BaseModel):
    x: int
    y: int

class FenceConfig(BaseModel):
    p1: Tuple[int, int] = (0, 360)
    p2: Tuple[int, int] = (1280, 360)

class ZoneConfig(BaseModel):
    polygon: List[Tuple[int, int]] = [(320, 200), (960, 200), (960, 600), (320, 600)]
    dwell_threshold_frames: int = 25
    speed_threshold_px: float = 30.0

class GeometryUpdate(BaseModel):
    camera_id: str = "BOP-01"
    fence: Optional[FenceConfig] = None
    zone: Optional[ZoneConfig] = None

class AlertEvent(BaseModel):
    camera_id: str
    timestamp: str
    frame: int
    object_type: str
    track_id: int
    event_type: str
    severity: str
    details: Optional[dict] = None
