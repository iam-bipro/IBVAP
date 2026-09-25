# IBVAP — Architecture & Technical Deep Dive

> **IBVAP** · Intelligent Border Video Analytics Platform
> Smart India Hackathon 2026 · Problem Code **DFS404**

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Repository Structure](#2-repository-structure)
3. [The 4-Step Pipeline](#3-the-4-step-pipeline)
   - [Step 01 — Edge Intelligence](#step-01--edge-intelligence)
   - [Step 02 — Central Queue](#step-02--central-queue)
   - [Step 03 — AI Engine](#step-03--ai-engine)
   - [Step 04 — Alert Engine](#step-04--alert-engine)
4. [AI Stack — 4 Jobs Running Simultaneously](#4-ai-stack--4-jobs-running-simultaneously)
5. [Alert Event Schema](#5-alert-event-schema)
6. [Geometry Rules Engine](#6-geometry-rules-engine)
7. [API Reference](#7-api-reference)
8. [Data Flow Diagram](#8-data-flow-diagram)
9. [Backend Code Map](#9-backend-code-map)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Key Design Decisions](#11-key-design-decisions)
12. [Getting Started](#12-getting-started)
13. [Environment Variables](#13-environment-variables)
14. [Tech Stack](#14-tech-stack)

---

## 1. System Overview

IBVAP is a **real-time AI surveillance platform** that ingests live CCTV video feeds, applies multi-model computer vision, and delivers actionable security alerts to operators in under 50 ms.

```
Multiple CCTV Cameras
        │
        ▼  (only on motion — saves ~90% bandwidth)
  Edge Intelligence
        │
        ▼
  Redis Event Queue  ◄── buffers burst traffic
        │
        ▼
    AI Engine
   ┌────┴────────────────────────┐
   │  YOLOv8n + ByteTrack        │  object detection + tracking
   │  YOLOv8-face + Gaussian blur│  privacy / face redaction
   │  EasyOCR                    │  ANPR / license plate reading
   │  CLAHE                      │  night vision enhancement
   └────────────────────────────┘
        │
        ▼
  Alert Rules Engine
   ┌────┴──────────────────────────────────┐
   │  Virtual Fence  → PERIMETER_BREACH    │
   │  Restricted Zone→ LOITERING_ALERT     │
   │  Speed check    → SUDDEN_MOVEMENT     │
   │  Direction check→ WRONG_WAY_VEHICLE   │
   │  Plate read     → ANPR_DETECT         │
   └───────────────────────────────────────┘
        │
   FastAPI + WebSocket
        │
   ┌────┴──────────────────────┐
   │  Dashboard (Next.js)      │  live feed + alert table
   │  Audio / desktop alerts   │  sound + OS popup
   │  Event History Log        │  SQLite / JSON
   └───────────────────────────┘
```

---

## 2. Repository Structure

```
ibvap/
├── apps/
│   ├── web/                        # Next.js 16 frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/auth/    # Supabase login
│   │   │   │   └── (protected)/
│   │   │   │       ├── dashboard/  # Live surveillance view
│   │   │   │       └── settings/   # Geometry configuration
│   │   │   ├── components/ibvap/
│   │   │   │   ├── LiveFeed.tsx       # MJPEG stream viewer
│   │   │   │   ├── AlertsTable.tsx    # Real-time alert feed
│   │   │   │   ├── AlertBadge.tsx     # Severity pill
│   │   │   │   ├── EngineStatus.tsx   # Health check badge
│   │   │   │   └── GeometryConfig.tsx # Fence/zone form
│   │   │   └── lib/ibvap/
│   │   │       └── client.ts          # Typed API client
│   │   └── package.json
│   │
│   └── api/                        # FastAPI backend
│       ├── app/
│       │   ├── main.py             # FastAPI app, WebSocket, MJPEG stream
│       │   ├── schemas.py          # Pydantic models (AlertEvent, GeometryUpdate…)
│       │   └── core/
│       │       ├── pipeline.py     # IBVAPEngine — orchestrates all CV models
│       │       └── geometry.py     # VirtualFence, RestrictedZone, VehicleTracker
│       ├── models/                 # YOLOv8 .pt weight files
│       ├── videos/                 # Test video feeds (day/night)
│       └── requirements.txt
│
├── fact-check/                     # Research & SIH presentation docs
├── IBVAP.ipynb                     # Exploration / training notebook
├── package.json                    # Root convenience scripts
└── ARCHITECTURE.md                 # ← this file
```

---

## 3. The 4-Step Pipeline

```
Camera → [Edge trigger] → [Redis buffer] → [AI Engine] → [Alert rules] → Operators
```

### Step 01 — Edge Intelligence

**What it does:** Each camera node runs OpenCV locally to detect motion using frame differencing — before any data leaves the camera.

**Why this way:** Running even a lightweight YOLO model on a server for 30 frames/second × N cameras is enormously expensive. The frame-diff trigger is near-zero cost (simple pixel arithmetic) and eliminates ~90% of frames that contain no meaningful activity.

#### How frame-differencing works

```python
import cv2

cap = cv2.VideoCapture(camera_source)
prev_gray = None

while cap.isOpened():
    ret, frame = cap.read()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (21, 21), 0)

    if prev_gray is not None:
        diff = cv2.absdiff(prev_gray, gray)
        thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)[1]

        if thresh.sum() > MOTION_THRESHOLD:
            # ← only NOW send this frame to the central queue
            push_to_queue(frame)

    prev_gray = gray
```

**Key insight:** An empty corridor at 3 AM produces zero events. A car entering a gate produces ~150 frames burst. The system scales perfectly to both scenarios.

#### Shared Event Queue

All camera nodes converge into a single shared queue with three consumer channels:

| Channel | Consumer |
|---------|---------|
| `DASH`  | Live dashboard — renders the annotated video tile |
| `ALERT` | Alert dispatcher — fires sound + popup |
| `LOG`   | History logger — writes to SQLite / JSON |

---

### Step 02 — Central Queue

**What it does:** A Redis-backed message queue absorbs event payloads from all camera nodes and feeds them to AI workers at a controlled rate.

**Why this way:** Camera bursts are spiky — a single incident can produce hundreds of frames in seconds. Without a queue, the AI engine would either drop frames or crash under load. Redis decouples **ingestion speed** (camera) from **processing speed** (GPU).

```
Camera 01 ──────────────────────────────────────────┐
Camera 02 ──────────────────────────────────────────┤
Camera N  ──────────────────────────────────────────┤
                                                     ▼
                                          ┌─────────────────┐
                                          │   Redis Queue   │
                                          │  (in-memory,    │
                                          │  ~1M ops/sec)   │
                                          └────────┬────────┘
                                                   │
                              ┌────────────────────┼──────────────────┐
                              ▼                    ▼                  ▼
                          AI Worker 1          AI Worker 2       AI Worker N
```

**Redis commands used:**
```bash
LPUSH  ibvap:events  <frame_payload>   # Camera pushes
BRPOP  ibvap:events  0                 # Worker blocks and pops
```

> **Current state:** The existing `pipeline.py` processes frames synchronously (no Redis yet). Redis integration is the next infrastructure milestone — it unlocks horizontal scaling by adding more AI worker processes.

---

### Step 03 — AI Engine

**What it does:** Runs four computer vision models on each incoming frame in sequence, producing annotated frames and structured alert events.

**Why this way:** Each model is specialized for one job. A single monolithic model trying to detect objects, read plates, and detect faces simultaneously would be harder to maintain, tune, and swap out. The pipeline approach lets us upgrade any model independently.

#### Model Pipeline Sequence

```
Raw frame
    │
    ├─► CLAHE enhancement  (if night-mode detected)
    │
    ├─► YOLOv8n.track()   ──► bounding boxes + class + track_id
    │       │
    │       ├─► For each vehicle:
    │       │       └─► license_plate_detector → EasyOCR → plate text
    │       │
    │       └─► Geometry rules (fence / zone / speed / direction)
    │
    ├─► YOLOv8-face        ──► face bounding boxes → Gaussian blur
    │
    └─► cv2.imencode()     ──► JPEG frame for MJPEG stream
```

#### Night Mode Auto-Detection

```python
is_night = np.mean(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)) < 85
if is_night:
    frame = self.apply_clahe(frame)
```

Mean pixel brightness below 85/255 (~33%) triggers night mode. CLAHE is then applied in LAB colour space (see [Section 4](#4-ai-stack--4-jobs-running-simultaneously)).

---

### Step 04 — Alert Engine

**What it does:** Evaluates the track data from Step 03 against configurable geometry rules, generates typed alert events, and pushes them to all connected WebSocket clients in real time.

**Why this way:** Separating rule evaluation from model inference means operators can change the fence line or restricted zone polygon **without retraining any model** — it's pure geometry. FastAPI + WebSocket gives sub-50ms push latency, far better than polling.

#### Rule Evaluation Logic

```python
# Virtual Fence — line crossing detection
if self.fence.update(track_id, bbox):
    alert("PERIMETER_BREACH", severity="CRITICAL")

# Restricted Zone — dwell time + speed
for zone_alert in self.zone.update(track_id, bbox, frame_idx):
    if zone_alert["type"] == "LOITERING_ALERT":
        alert("LOITERING_ALERT", severity="WARNING")
    if zone_alert["type"] == "SUDDEN_MOVEMENT":
        alert("SUDDEN_MOVEMENT", severity="WARNING")

# Vehicle direction — wrong-way detection
direction, v_events = self.vehicle_tracker.update(track_id, bbox, frame_idx)
for ve in v_events:
    if ve["type"] == "WRONG_WAY_VEHICLE":
        alert("WRONG_WAY_VEHICLE", severity="CRITICAL")
```

#### WebSocket Broadcast

```python
async def broadcast_alerts(alerts: List[dict]):
    for alert in alerts:
        alert_history.append(alert)          # persist in-memory
        for ws in active_websockets:
            await ws.send_json(alert)         # push to all dashboards
```

Each connected browser tab receives alerts the instant they are generated — no polling interval, no delay.

---

## 4. AI Stack — 4 Jobs Running Simultaneously

### Job 1 — YOLOv8n + ByteTrack (Object Detection & Tracking)

**YOLOv8n** (nano variant) is the fastest member of the YOLOv8 family. It runs a single-pass convolutional network that simultaneously predicts bounding boxes, confidence scores, and class labels for all objects in one frame.

```
Frame → Backbone (CSPDarknet) → Neck (PAN-FPN) → Head → [boxes, scores, classes]
```

Why nano? At 640×640 input, YOLOv8n runs at ~200 FPS on a mid-tier GPU — enough for real-time multi-camera processing.

**ByteTrack** solves the "who is who across frames" problem. It assigns a **persistent `track_id`** to each detection by matching current boxes to previous boxes using IoU (Intersection over Union) and Kalman filter motion prediction.

```
Frame 1:  car at (100, 200) → track_id = 47
Frame 2:  car at (105, 198) → track_id = 47  ✓ (same car)
Frame 50: car at (300, 150) → track_id = 47  ✓ (still same car)
```

This persistent ID enables:
- **Dwell time** = `current_frame - entry_frame` for track_id 47
- **Trajectory** = history of (cx, cy) positions for track_id 47
- **Fence crossing** = did track_id 47's path segment intersect the fence line?

---

### Job 2 — EasyOCR (ANPR — Automatic Number Plate Recognition)

After YOLOv8n detects a vehicle, a second dedicated model (`license_plate_detector.pt`) crops the plate region. EasyOCR then reads the text character by character.

```python
def extract_plate(self, frame, bbox):
    crop = frame[y1:y2, x1:x2]                    # crop plate region
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)  # grayscale
    results = self.ocr_reader.readtext(gray)        # OCR

    texts = []
    for (_, text, conf) in results:
        clean = re.sub(r'[^A-Z0-9]', '', text.upper())  # strip noise
        if len(clean) >= 4:
            texts.append(clean)

    return "".join(texts), max_confidence
```

**Plate deduplication:** A `plate_cache` set ensures each unique plate number is only alerted once per session — avoids spam from the same car triggering 30 alerts as it drives through the frame.

---

### Job 3 — YOLOv8-face + Gaussian Blur (Privacy / Face Redaction)

Every frame that is stored, streamed, or displayed has all detected faces blurred before leaving the AI engine.

```python
def redact_faces(self, frame):
    results = self.face_detector(frame, conf=0.4)[0]
    for box in results.boxes.xyxy.cpu().numpy():
        x1, y1, x2, y2 = map(int, box)
        roi = frame[y1:y2, x1:x2]
        frame[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (51, 51), 30)
    return frame
```

A 51×51 Gaussian kernel with σ=30 produces a strong anonymisation blur. The face is unrecognisable but the body and context remain visible for security analysis.

**Why this matters:** India's **Digital Personal Data Protection (DPDP) Act 2023** and general GDPR principles require that biometric data (faces) not be stored without consent. Redacting at the frame level before storage ensures compliance by design.

---

### Job 4 — CLAHE (Night Vision Enhancement)

Raw night-time CCTV frames are often too dark for accurate detection. Simple brightness boosting (`frame * 1.5`) amplifies both signal and noise and causes colour distortion.

**CLAHE (Contrast Limited Adaptive Histogram Equalization)** solves this elegantly:

```python
def apply_clahe(self, frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)   # convert to LAB
    l, a, b = cv2.split(lab)                        # split channels
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)                     # enhance only L
    return cv2.cvtColor(cv2.merge((l_enhanced, a, b)), cv2.COLOR_LAB2BGR)
```

**Why LAB colour space?**
- `L` = Lightness (luminance only)
- `A` = Green ↔ Red component
- `B` = Blue ↔ Yellow component

By enhancing only `L` and leaving `A`/`B` untouched, colours remain natural. A white car stays white — it doesn't turn yellow as it would with naive brightness scaling.

**`clipLimit=3.0`** prevents over-amplifying noise in already-bright patches (the "limited" part of CLAHE). **`tileGridSize=(8,8)`** divides the image into 64 local regions so dark corners get boosted independently from bright lamp posts.

---

## 5. Alert Event Schema

Every alert produced by the engine conforms to this Pydantic schema:

```python
class AlertEvent(BaseModel):
    camera_id:   str            # e.g. "BOP-01"
    timestamp:   str            # ISO 8601
    frame:       int            # frame index in the video
    object_type: str            # "car", "person", "truck", …
    track_id:    int            # ByteTrack persistent ID
    event_type:  str            # see table below
    severity:    str            # "CRITICAL" | "WARNING" | "INFO"
    details:     Optional[dict] # extra payload (plate text, speed, etc.)
```

| `event_type` | `severity` | `details` payload |
|---|---|---|
| `PERIMETER_BREACH` | CRITICAL | — |
| `WRONG_WAY_VEHICLE` | CRITICAL | `{"direction": "DOWN"}` |
| `LOITERING_ALERT` | WARNING | `{"dwell_frames": 42}` |
| `SUDDEN_MOVEMENT` | WARNING | `{"speed_px": 38.5}` |
| `ANPR_DETECT` | INFO | `{"plate": "MH12AB1234", "conf": 0.91}` |

---

## 6. Geometry Rules Engine

### Virtual Fence (Line Crossing)

```
Frame width: 1280px
Default fence: y=360 (horizontal midline)

  ─────────────────────── y=0
  .                                   .
  .         (camera view)             .
  ─────────────────────── y=360  ◄── fence line
  .                                   .
  ─────────────────────── y=720
```

The fence is defined by two points `p1=(x1,y1)` and `p2=(x2,y2)`. A crossing is detected when the segment formed by an object's **bottom-center** position in consecutive frames intersects the fence segment — using the CCW (counter-clockwise) geometric intersection test.

### Restricted Zone (Polygon Dwell)

```
Default zone polygon:
  (320, 200) ──── (960, 200)
      │                │
  (320, 600) ──── (960, 600)
```

`cv2.pointPolygonTest()` checks if an object's centroid is inside the polygon. If it stays inside for more than `dwell_threshold_frames` (default: 25 frames ≈ 1 second at 25fps), a `LOITERING_ALERT` fires.

### Vehicle Direction (Wrong-Way Detection)

The vehicle tracker stores a deque of the last 30 centroid positions. After 10+ frames:

```python
dx = trajectory[-1][0] - trajectory[0][0]  # horizontal displacement
dy = trajectory[-1][1] - trajectory[0][1]  # vertical displacement

if abs(dx) > abs(dy):
    direction = "RIGHT" if dx > 0 else "LEFT"
else:
    direction = "DOWN" if dy > 0 else "UP"

# Moving DOWN = moving toward camera = wrong way on a one-way road
if direction == "DOWN":
    alert("WRONG_WAY_VEHICLE")
```

All geometry parameters are **hot-configurable** via `POST /api/v1/config/geometry` — no restart needed.

---

## 7. API Reference

### Base URL
```
http://localhost:8000
```

### Endpoints

#### `GET /health`
Returns engine readiness status.
```json
{ "status": "operational", "engine_ready": true }
```

---

#### `GET /api/v1/alerts`
Fetch alert history (newest last).

| Query param | Default | Description |
|---|---|---|
| `limit` | `50` | Max number of events to return |

```bash
curl http://localhost:8000/api/v1/alerts?limit=100
```

---

#### `POST /api/v1/config/geometry`
Update virtual fence and/or restricted zone. Changes apply **instantly** to the running engine.

```json
{
  "camera_id": "BOP-01",
  "fence": {
    "p1": [0, 400],
    "p2": [1280, 400]
  },
  "zone": {
    "polygon": [[200, 150], [900, 150], [900, 550], [200, 550]],
    "dwell_threshold_frames": 30,
    "speed_threshold_px": 25.0
  }
}
```

Response:
```json
{ "status": "success", "message": "Geometry updated" }
```

---

#### `GET /api/v1/stream`
MJPEG live video stream. Use directly in an `<img>` tag.

| Query param | Default | Description |
|---|---|---|
| `source` | `videos/day.mp4` | Video file path or RTSP URL |

```html
<img src="http://localhost:8000/api/v1/stream?source=videos/night_real.mp4" />
```

---

#### `WS /ws/alerts`
Real-time WebSocket feed. Each message is a JSON `AlertEvent`.

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/alerts");
ws.onmessage = (e) => {
  const alert = JSON.parse(e.data);
  console.log(alert.event_type, alert.severity);
};
// Send any text to keep-alive
setInterval(() => ws.send("ping"), 20_000);
```

---

## 8. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        CAMERA LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │ Camera 1 │  │ Camera 2 │  │ Camera N │   (edge: OpenCV cv2)  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                       │
│       │  frame-diff trigger        │                             │
│       └────────────┬───────────────┘                             │
└────────────────────┼────────────────────────────────────────────┘
                     │  (only triggered frames)
                     ▼
┌────────────────────────────────────────────────────────────────┐
│                      QUEUE LAYER                               │
│              ┌─────────────────────┐                           │
│              │    Redis Queue      │  LPUSH / BRPOP            │
│              └──────────┬──────────┘                           │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────────────┐
│                       AI ENGINE LAYER                          │
│                                                                │
│  frame ──► CLAHE (if night) ──► YOLOv8n.track()               │
│                                      │                         │
│                          ┌───────────┴──────────────┐          │
│                          │   For each detection:    │          │
│                          │  - Fence crossing check  │          │
│                          │  - Zone dwell check      │          │
│                          │  - Speed check           │          │
│                          │  - Direction check       │          │
│                          │  - ANPR (if vehicle)     │          │
│                          └───────────────────────── ┘          │
│  frame ──► YOLOv8-face ──► Gaussian blur all faces             │
│  frame ──► cv2.imencode() ──► MJPEG byte stream                │
└──────────────────────────────┬─────────────────────────────────┘
                               │ alerts[]
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                    ALERT ENGINE LAYER                          │
│                                                                │
│  IBVAPEngine.process_frame() returns (annotated_frame, alerts) │
│                                                                │
│  FastAPI ──► broadcast_alerts() ──► all WebSocket clients      │
│           ──► alert_history[]  ──► GET /api/v1/alerts          │
│           ──► MJPEG response   ──► GET /api/v1/stream          │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│                     OPERATOR LAYER                             │
│                                                                │
│  Next.js Dashboard  ──► LiveFeed + AlertsTable + Stats         │
│  Audio alerts       ──► Sound API (Python / Browser)           │
│  Desktop popups     ──► OS Notification API                    │
│  Event history      ──► SQLite / JSON log                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 9. Backend Code Map

Every component in the architecture diagram maps directly to existing code:

| Architecture Component | File | Class / Function |
|------------------------|------|-----------------|
| MJPEG stream generator | `app/main.py` | `generate_video_stream()` |
| WebSocket alert hub | `app/main.py` | `websocket_alerts()`, `broadcast_alerts()` |
| AI engine orchestrator | `app/core/pipeline.py` | `IBVAPEngine` |
| Night enhancement | `app/core/pipeline.py` | `IBVAPEngine.apply_clahe()` |
| Face redaction | `app/core/pipeline.py` | `IBVAPEngine.redact_faces()` |
| ANPR plate reader | `app/core/pipeline.py` | `IBVAPEngine.extract_plate()` |
| Main frame processor | `app/core/pipeline.py` | `IBVAPEngine.process_frame()` |
| Virtual fence geometry | `app/core/geometry.py` | `VirtualFence` |
| Restricted zone + dwell | `app/core/geometry.py` | `RestrictedZone` |
| Wrong-way tracker | `app/core/geometry.py` | `VehicleTracker` |
| Geometry hot-config API | `app/main.py` | `update_geometry()` |
| Alert history API | `app/main.py` | `get_alerts()` |
| Pydantic schemas | `app/schemas.py` | `AlertEvent`, `GeometryUpdate`, … |

> **What is NOT yet implemented:** Redis queue integration. Currently `generate_video_stream()` calls `process_frame()` synchronously in a single thread. A production deployment would replace this with async Redis workers.

---

## 10. Frontend Architecture

The Next.js frontend (`apps/web/`) connects to the backend via three channels:

| Channel | Used by | How |
|---------|---------|-----|
| `GET /api/v1/alerts` | `dashboard/page.tsx` | On mount — loads history |
| `WS /ws/alerts` | `dashboard/page.tsx` | Persistent — real-time push |
| `GET /api/v1/stream` | `LiveFeed.tsx` | MJPEG in `<img src="…">` |
| `GET /health` | `EngineStatus.tsx` | Polling every 10 s |
| `POST /api/v1/config/geometry` | `GeometryConfig.tsx` | On form submit |

All HTTP/WS calls are centralised in [`src/lib/ibvap/client.ts`](apps/web/src/lib/ibvap/client.ts).

```
Dashboard Page
├── EngineStatus      →  GET /health (poll 10s)
├── LiveFeed          →  GET /api/v1/stream (MJPEG img)
├── AlertsTable       →  WS  /ws/alerts (real-time)
│                     →  GET /api/v1/alerts (initial load)
└── EventBreakdown    →  derived from alert state (no extra request)

Settings Page
└── GeometryConfig    →  POST /api/v1/config/geometry
```

---

## 11. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Edge motion trigger first** | Eliminates ~90% of frames before any GPU work — scales to many cameras cheaply |
| **YOLOv8n (nano) over larger variants** | ~200 FPS throughput for real-time use; sufficient accuracy for surveillance |
| **ByteTrack for persistent IDs** | Enables temporal analytics (dwell, trajectory) that single-frame detection cannot provide |
| **Separate face detection model** | Modular — can be upgraded or swapped without affecting the main detector |
| **CLAHE in LAB space** | Enhances luminance only — no colour distortion in night frames |
| **Plate cache deduplication** | Prevents the same plate from generating dozens of ANPR alerts as the car traverses the frame |
| **FastAPI WebSocket broadcast** | Sub-50ms push latency — no polling overhead, instant operator awareness |
| **MJPEG over `<img>` tag** | Browser-native support — no special video.js or HLS setup needed |
| **Geometry as hot-config API** | Operators change fence/zone positions live without restarting the AI engine |
| **Pydantic schemas for all I/O** | Auto-validation + auto-generated OpenAPI docs at `/docs` |

---

## 12. Getting Started

### Prerequisites

- Python 3.10+
- Node.js 20+
- CUDA-capable GPU (recommended for real-time performance)
- FFmpeg (for video processing)

### Backend Setup

```bash
cd apps/api

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (macOS / Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Place model weights in apps/api/models/
#   ibvap_detector.pt
#   license_plate_detector.pt
#   yolov8n-face.pt

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### Frontend Setup

```bash
# From repo root
npm run dev
# → http://localhost:3000

# Or directly from apps/web/
cd apps/web && npm run dev
```

---

## 13. Environment Variables

### `apps/web/.env.local`

```env
# IBVAP backend base URL
NEXT_PUBLIC_IBVAP_URL=http://localhost:8000

# Supabase (for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 14. Tech Stack

### Backend (`apps/api/`)

| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111+ | REST API + WebSocket server |
| Uvicorn | 0.29+ | ASGI server |
| Ultralytics (YOLOv8) | 8.x | Object detection + tracking |
| EasyOCR | 1.7+ | License plate text recognition |
| OpenCV (`cv2`) | 4.9+ | Frame processing, CLAHE, MJPEG encoding |
| NumPy | 1.26+ | Numerical operations |
| Pydantic v2 | 2.x | Schema validation |

### Frontend (`apps/web/`)

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.2 | React framework + routing |
| React | 19 | UI rendering |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Utility-first styling |
| Supabase SSR | 0.12+ | Authentication |
| Lucide React | 1.28+ | Icon library |
| next-themes | 0.4+ | Dark/light mode |
