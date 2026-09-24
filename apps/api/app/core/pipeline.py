import cv2
import re
import numpy as np
from datetime import datetime
from ultralytics import YOLO
import easyocr
from app.core.geometry import VirtualFence, RestrictedZone, VehicleTracker

class IBVAPEngine:
    def __init__(self, detector_path: str, plate_model_path: str, face_model_path: str):
        self.detector = YOLO(detector_path)
        self.plate_detector = YOLO(plate_model_path)
        self.face_detector = YOLO(face_model_path)
        self.ocr_reader = easyocr.Reader(['en'], gpu=True)
        
        self.fence = VirtualFence()
        self.zone = RestrictedZone([(320, 200), (960, 200), (960, 600), (320, 600)])
        self.vehicle_tracker = VehicleTracker()
        
        self.target_vehicles = {'car', 'bus', 'truck', 'motorcycle', 'bicycle'}
        self.plate_cache = set()

    def set_geometry(self, fence_cfg=None, zone_cfg=None):
        if fence_cfg:
            self.fence = VirtualFence(p1=fence_cfg.p1, p2=fence_cfg.p2)
        if zone_cfg:
            self.zone = RestrictedZone(
                polygon=zone_cfg.polygon,
                dwell_threshold_frames=zone_cfg.dwell_threshold_frames,
                speed_threshold_px=zone_cfg.speed_threshold_px
            )

    def apply_clahe(self, frame):
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        return cv2.cvtColor(cv2.merge((clahe.apply(l), a, b)), cv2.COLOR_LAB2BGR)

    def redact_faces(self, frame):
        results = self.face_detector(frame, conf=0.4, verbose=False)[0]
        if results.boxes:
            h, w = frame.shape[:2]
            for box in results.boxes.xyxy.cpu().numpy():
                x1, y1, x2, y2 = map(int, box)
                roi = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
                if roi.size > 0:
                    frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)] = cv2.GaussianBlur(roi, (51, 51), 30)
        return frame

    def extract_plate(self, frame, bbox):
        x1, y1, x2, y2 = map(int, bbox)
        h, w = frame.shape[:2]
        crop = frame[max(0, y1):min(h, y2), max(0, x1):min(w, x2)]
        if crop.size == 0: return None, 0.0
        
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        res = self.ocr_reader.readtext(gray)
        if not res: return None, 0.0
        
        texts, confs = [], []
        for (_, text, conf) in res:
            clean = re.sub(r'[^A-Z0-9]', '', text.upper())
            if len(clean) >= 4:
                texts.append(clean)
                confs.append(conf)
        return ("".join(texts), max(confs)) if texts else (None, 0.0)

    def process_frame(self, frame, frame_idx: int, camera_id: str = "BOP-01"):
        alerts = []
        is_night = np.mean(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)) < 85
        if is_night:
            frame = self.apply_clahe(frame)

        results = self.detector.track(frame, persist=True, tracker="bytetrack.yaml", verbose=False, conf=0.30)[0]

        if results.boxes and results.boxes.id is not None:
            boxes = results.boxes.xyxy.cpu().numpy()
            track_ids = results.boxes.id.int().cpu().numpy()
            classes = results.boxes.cls.int().cpu().numpy()

            for box, tid, cls_id in zip(boxes, track_ids, classes):
                cls_name = self.detector.names[cls_id]
                x1, y1, x2, y2 = map(int, box)
                color = (0, 255, 0)
                status = f"ID:{tid} {cls_name}"

                base_event = {
                    "camera_id": camera_id,
                    "timestamp": datetime.now().isoformat(),
                    "frame": frame_idx,
                    "object_type": cls_name,
                    "track_id": int(tid)
                }

                if self.fence.update(tid, box):
                    alerts.append({**base_event, "event_type": "PERIMETER_BREACH", "severity": "CRITICAL"})

                for za in self.zone.update(tid, box, frame_idx):
                    alerts.append({**base_event, "event_type": za["type"], "severity": "WARNING", "details": za})

                if cls_name.lower() in self.target_vehicles:
                    direction, v_events = self.vehicle_tracker.update(tid, box, frame_idx)
                    status += f" [{direction}]"
                    for ve in v_events:
                        alerts.append({**base_event, "event_type": ve["type"], "severity": "CRITICAL"})

                    p_res = self.plate_detector(frame, conf=0.35, verbose=False)[0]
                    if p_res.boxes:
                        for p_box in p_res.boxes.xyxy.cpu().numpy():
                            text, conf = self.extract_plate(frame, p_box)
                            if text and text not in self.plate_cache:
                                self.plate_cache.add(text)
                                alerts.append({**base_event, "event_type": "ANPR_DETECT", "severity": "INFO", "details": {"plate": text, "conf": round(float(conf), 2)}})

                if tid in self.fence.breaches:
                    color = (0, 0, 255)

                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, status, (x1, max(20, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 2)

        frame = self.redact_faces(frame)

        # Overlays
        cv2.line(frame, self.fence.line_p1, self.fence.line_p2, (0, 0, 255), 2)
        cv2.polylines(frame, [self.zone.polygon], True, (0, 255, 255), 2)
        cv2.putText(frame, "NIGHT" if is_night else "DAY", (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255) if is_night else (0, 255, 0), 2)

        return frame, alerts
