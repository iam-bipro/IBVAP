import cv2
import numpy as np
from collections import deque

def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def intersect(A, B, C, D):
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)

class VirtualFence:
    def __init__(self, p1=(0, 360), p2=(1280, 360)):
        self.line_p1 = tuple(p1)
        self.line_p2 = tuple(p2)
        self.track_history = {}
        self.breaches = set()

    def update(self, track_id: int, bbox: list) -> bool:
        x1, y1, x2, y2 = bbox
        bottom_center = ((x1 + x2) / 2, y2)
        if track_id not in self.track_history:
            self.track_history[track_id] = []
        self.track_history[track_id].append(bottom_center)

        if len(self.track_history[track_id]) >= 2:
            prev_pt = self.track_history[track_id][-2]
            curr_pt = self.track_history[track_id][-1]
            if intersect(prev_pt, curr_pt, self.line_p1, self.line_p2):
                if track_id not in self.breaches:
                    self.breaches.add(track_id)
                    return True
        return False

class RestrictedZone:
    def __init__(self, polygon, dwell_threshold_frames=25, speed_threshold_px=30.0):
        self.polygon = np.array(polygon, np.int32)
        self.dwell_threshold = dwell_threshold_frames
        self.speed_threshold = speed_threshold_px
        self.entry_frames = {}
        self.last_positions = {}
        self.alerted_loitering = set()

    def update(self, track_id: int, bbox: list, frame_idx: int) -> list:
        x1, y1, x2, y2 = bbox
        cx, cy = int((x1 + x2) / 2), int(y2)
        is_inside = cv2.pointPolygonTest(self.polygon, (cx, cy), False) >= 0
        alerts = []

        if is_inside:
            if track_id not in self.entry_frames:
                self.entry_frames[track_id] = frame_idx
            dwell = frame_idx - self.entry_frames[track_id]
            if dwell >= self.dwell_threshold and track_id not in self.alerted_loitering:
                self.alerted_loitering.add(track_id)
                alerts.append({"type": "LOITERING_ALERT", "dwell_frames": int(dwell)})
        else:
            self.entry_frames.pop(track_id, None)
            self.alerted_loitering.discard(track_id)

        if track_id in self.last_positions:
            prev_cx, prev_cy = self.last_positions[track_id]
            speed = np.hypot(cx - prev_cx, cy - prev_cy)
            if speed > self.speed_threshold:
                alerts.append({"type": "SUDDEN_MOVEMENT", "speed_px": round(float(speed), 2)})

        self.last_positions[track_id] = (cx, cy)
        return alerts

class VehicleTracker:
    def __init__(self, history_len=30):
        self.trajectories = {}
        self.history_len = history_len
        self.wrong_way_alerts = set()

    def update(self, track_id: int, bbox: list, frame_idx: int):
        x1, y1, x2, y2 = bbox
        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
        if track_id not in self.trajectories:
            self.trajectories[track_id] = deque(maxlen=self.history_len)
        self.trajectories[track_id].append((cx, cy))

        direction = "STATIONARY"
        events = []
        if len(self.trajectories[track_id]) >= 10:
            dx = self.trajectories[track_id][-1][0] - self.trajectories[track_id][0][0]
            dy = self.trajectories[track_id][-1][1] - self.trajectories[track_id][0][1]
            direction = ("RIGHT" if dx > 0 else "LEFT") if abs(dx) > abs(dy) else ("DOWN" if dy > 0 else "UP")

            if direction == "DOWN" and track_id not in self.wrong_way_alerts:
                self.wrong_way_alerts.add(track_id)
                events.append({"type": "WRONG_WAY_VEHICLE", "direction": direction})

        return direction, events
