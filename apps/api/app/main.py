import cv2
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List

from app.schemas import GeometryUpdate, AlertEvent
from app.core.pipeline import IBVAPEngine

# App State / Dependencies
engine: IBVAPEngine = None
active_websockets: List[WebSocket] = []
alert_history: List[dict] = []

@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    # Initialize models once during startup
    engine = IBVAPEngine(
        detector_path="models/ibvap_detector.pt",
        plate_model_path="models/license_plate_detector.pt",
        face_model_path="models/yolov8n-face.pt"
    )
    print("✓ IBVAP Engine models loaded successfully.")
    yield
    print("Shutting down IBVAP Engine.")

app = FastAPI(title="IBVAP Backend API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def broadcast_alerts(alerts: List[dict]):
    global alert_history
    for alert in alerts:
        alert_history.append(alert)
        dead_sockets = []
        for ws in active_websockets:
            try:
                await ws.send_json(alert)
            except Exception:
                dead_sockets.append(ws)
        for dead in dead_sockets:
            active_websockets.remove(dead)

# --- Endpoints ---

@app.get("/health")
def health():
    return {"status": "operational", "engine_ready": engine is not None}

@app.post("/api/v1/config/geometry")
def update_geometry(config: GeometryUpdate):
    engine.set_geometry(config.fence, config.zone)
    return {"status": "success", "message": "Geometry updated"}

@app.get("/api/v1/alerts", response_model=List[AlertEvent])
def get_alerts(limit: int = 50):
    return alert_history[-limit:]

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep-alive
    except WebSocketDisconnect:
        active_websockets.remove(websocket)

import os

def generate_video_stream(video_source: str):
    # Resolve video path safely
    resolved_source = video_source
    if not os.path.exists(resolved_source):
        # Try relative to apps/api/ if started from root
        alt = os.path.join("apps", "api", video_source)
        if os.path.exists(alt):
            resolved_source = alt
        else:
            # Fallback to any valid sample video
            for candidate in ["videos/crowd_cctv.mp4", "videos/traffic_cctv.mp4", "videos/night_real.mp4"]:
                if os.path.exists(candidate):
                    resolved_source = candidate
                    break
                elif os.path.exists(os.path.join("apps", "api", candidate)):
                    resolved_source = os.path.join("apps", "api", candidate)
                    break

    cap = cv2.VideoCapture(resolved_source)
    frame_idx = 0

    if not cap.isOpened():
        print(f"Error: Unable to open video source: {resolved_source}")
        return

    retry_count = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            retry_count += 1
            if retry_count > 5:
                # Video ended or unreadable, loop back to start
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                retry_count = 0
                ret, frame = cap.read()
                if not ret:
                    break
            else:
                continue
        else:
            retry_count = 0

        frame_idx += 1

        annotated_frame, alerts = engine.process_frame(frame, frame_idx)

        if alerts:
            asyncio.run(broadcast_alerts(alerts))

        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    cap.release()

@app.get("/api/v1/stream")
def stream_feed(source: str = "videos/traffic_cctv.mp4"):
    return StreamingResponse(
        generate_video_stream(source),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
