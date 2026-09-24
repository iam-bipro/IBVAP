# IBVAP — Intelligent Border Video Analytics Platform
### Jupyter Notebook (`IBVAP.ipynb`) — Detailed Code Walkthrough

**Problem Statement (Ministry of Home Affairs):**
> Border Out Posts already have CCTV cameras — but cameras alone can't think. IBVAP is a pure-software AI layer that turns any standard IP camera feed into an intelligent sentry, detecting intrusions, reading number plates, flagging loitering, and seeing in near-zero light — **without buying a single piece of new hardware.**

---

## How to Read This Guide

This document walks through every cell in the notebook in plain English. Each section explains **what the code does**, **why it does it**, and **what connects to what**. No prior deep learning knowledge is required.

---

## Phase 1: Environment Setup
> *Cells 0–2: Get Google Colab ready with the right tools.*

---

### 🟦 Cell 0 — Load Your Trained Models from Google Drive

```python
from google.colab import drive
import os

drive.mount('/content/drive')
os.makedirs('models', exist_ok=True)
!cp /content/drive/MyDrive/models/*.pt ./models/
print('Models copied successfully!')
```

| Line | What it does |
|---|---|
| `from google.colab import drive` | Imports the Colab tool that lets you connect to Google Drive |
| `drive.mount('/content/drive')` | Plugs your Google Drive into Colab so files there can be read like local files |
| `os.makedirs('models', exist_ok=True)` | Creates a `models/` folder in Colab (if it doesn't exist already) |
| `!cp /content/drive/MyDrive/models/*.pt ./models/` | Copies all your trained `.pt` model files from Drive into Colab's local storage |
| `print('Models copied successfully!')` | Confirms the copy worked |

> **Why?** Google Colab's memory is wiped every session. This cell ensures your pre-trained models are always ready to use, pulled from your personal Drive where they are permanently stored.

---

### 🟦 Cell 1 — Check if a GPU is Available

```python
import torch

print("PyTorch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
```

| Line | What it does |
|---|---|
| `import torch` | Loads PyTorch, the AI framework that powers YOLO |
| `torch.cuda.is_available()` | Returns `True` if a GPU (graphics card) is accessible |
| `torch.cuda.get_device_name(0)` | Prints the name of the GPU (e.g., Tesla T4) |

> **Why?** Processing video with AI is extremely slow on a regular CPU. A GPU can process the same task 50–100x faster. This cell quickly verifies that Colab's free GPU is active before running anything.

---

### 🟦 Cell 2 — Install Libraries and Import Tools

```python
!pip install -q ultralytics supervision easyocr opencv-python-headless

from ultralytics import YOLO
import cv2
import numpy as np
import pandas as pd
import torch
import json
import os
```

| Line | What it does |
|---|---|
| `!pip install ...` | Downloads and installs the required AI tools into Colab |
| `ultralytics` | The library that contains YOLO — the object detection model |
| `easyocr` | The library that reads text from images (used for license plates) |
| `opencv-python-headless` | A library for opening, editing, and saving videos/images |
| `from ultralytics import YOLO` | Loads the YOLO class into our code |
| `import cv2` | Loads OpenCV for all video frame operations |
| `import numpy as np` | Loads NumPy for fast math on arrays of pixel values |
| `import pandas as pd` | Loads Pandas for organizing data into tables |

---

## Phase 2: Project Folder Setup
> *Cells 3–8: Create a permanent, organized folder structure on Google Drive.*

---

### 🟦 Cell 3 — Create the Project Directory on Drive

```python
from google.colab import drive
drive.mount('/content/drive')

BASE = "/content/drive/MyDrive/IBVAP"
folders = ["datasets", "models", "videos", "outputs", "metrics", "showcase"]

for folder in folders:
    os.makedirs(f"{BASE}/{folder}", exist_ok=True)

print("IBVAP directory structure initialized.")
```

| Line | What it does |
|---|---|
| `BASE = "..."` | Defines the root folder path for the entire project on Drive |
| `folders = [...]` | Lists the subfolders to create — datasets, models, videos, etc. |
| `os.makedirs(...)` | Creates each folder (skips if it already exists) |

> **Why?** Like a project filing cabinet — everything goes in its right place. Models in `models/`, raw data in `datasets/`, final demo videos in `showcase/`.

---

### 🟦 Cells 4–8 — Path Verification & ExDark Folder Creation

These cells are simple **health checks** — they verify that the folders created above actually exist, and print their contents. Cell 8 specifically creates the `exdark/` dataset subfolder.

```python
# Example: Cell 5 — Check if exdark folder exists
exdark_dir = f"{BASE}/datasets/exdark"
print("Exists:", os.path.exists(exdark_dir))
if os.path.exists(exdark_dir):
    for item in os.listdir(exdark_dir): print(" -", item)
```

> **Why?** When working with large files in Drive, it's easy to have path typos or missing folders. These checks catch errors before any training begins.

---

## Phase 3: Dataset Acquisition (ExDark)
> *Cells 9–16: Download and inspect the low-light training dataset.*

---

### 🟦 Cell 9 — Download ExDark Dataset via Roboflow

```python
!pip install roboflow

from roboflow import Roboflow
rf = Roboflow(api_key="...")
project = rf.workspace("chs-s7apx").project("exdark-aiswr")
version = project.version(1)
dataset = version.download("yolov8")
```

| Line | What it does |
|---|---|
| `Roboflow(api_key=...)` | Authenticates with Roboflow, a platform hosting annotated computer vision datasets |
| `.project("exdark-aiswr")` | Selects the **ExDark** dataset — a specialized collection of images taken in **low light and dark conditions** |
| `.version(1).download("yolov8")` | Downloads the dataset pre-formatted for YOLO training |

> **Why ExDark?** The MoHA problem statement explicitly requires **night-time movement detection**. Standard datasets (like COCO) contain daytime images only. ExDark provides dim-light, indoor, and near-dark images — exactly what border cameras see at night.

---

### 🟦 Cells 10–13 — Inspect the Downloaded Dataset

These cells walk through the downloaded folder structure and print the `data.yaml` file. The `data.yaml` tells YOLO where the images and labels are and what classes exist (e.g., person, car, bicycle).

---

### 🟦 Cell 14 — Copy Dataset from Colab to Drive

```python
import shutil

SOURCE = "/content/exdark-1"
DEST = f"{BASE}/datasets/exdark"

if os.path.exists(SOURCE) and os.path.exists(DEST):
    shutil.copytree(SOURCE, DEST, dirs_exist_ok=True)
    print("Dataset copied successfully!")
```

> **Why?** Colab's local storage is deleted after each session. Copying the dataset to Drive means you never need to re-download it.

---

### 🟦 Cells 15–17 — Verify Structure and Count Training Images

Cell 17 counts how many images of each class exist in the dataset:

```python
counter = Counter()
for file in os.listdir(label_dir):
    if file.endswith(".txt"):
        with open(os.path.join(label_dir, file)) as f:
            for line in f:
                parts = line.strip().split()
                if parts:
                    counter[int(parts[0])] += 1
print("Class distribution:", counter)
```

> **Why?** An imbalanced dataset (e.g., 10,000 car images but only 50 person images) leads to a biased model. This cell reveals any class imbalance before training starts.

---

## Phase 4: Training the Low-Light Detector
> *Cells 18–20: Fine-tune YOLO on ExDark to create an IBVAP-specific model.*

---

### 🟦 Cell 18 — Train YOLOv8 on ExDark

```python
model = YOLO("yolov8n.pt")

results = model.train(
    data=f"{BASE}/datasets/exdark/data.yaml",
    epochs=50,
    imgsz=640,
    batch=16,
    patience=10,
    workers=2,
    project=f"{BASE}/outputs",
    name="exdark_yolov8n"
)
```

| Parameter | What it means |
|---|---|
| `YOLO("yolov8n.pt")` | Loads YOLOv8 **nano** — the smallest, fastest version, ideal for real-time edge deployments |
| `epochs=50` | The model sees the entire dataset 50 times to learn from it |
| `imgsz=640` | Each image is resized to 640×640 pixels before being fed into the model |
| `batch=16` | Processes 16 images at once per GPU step |
| `patience=10` | If accuracy doesn't improve for 10 consecutive epochs, training stops early to save time |
| `project=...` | Saves all training logs, graphs, and model weights to Drive |

> **Why fine-tune?** A generic YOLO model trained on daytime images performs poorly in dark scenes. By training it on ExDark, IBVAP learns to recognize people and vehicles even in near-zero light conditions — a key differentiator over standard surveillance software.

---

### 🟦 Cell 19 — Save the Best Model

```python
!cp {BASE}/outputs/exdark_yolov8n/weights/best.pt {BASE}/models/ibvap_exdark_v1.pt
print("ExDark v1 model saved to Drive.")
```

Copies the best-performing model checkpoint from the training run into the permanent `models/` folder.

---

### 🟦 Cell 20 — Evaluate Model Performance

```python
model = YOLO(f"{BASE}/models/ibvap_exdark_v1.pt")
metrics = model.val(data=f"{BASE}/datasets/exdark/data.yaml", imgsz=640)

print(f"mAP50:     {metrics.box.map50:.3f}")
print(f"mAP50-95:  {metrics.box.map:.3f}")
print(f"Precision: {metrics.box.mp:.3f}")
print(f"Recall:    {metrics.box.mr:.3f}")
```

| Metric | What it measures |
|---|---|
| **mAP50** | How often the model correctly finds objects (at 50% overlap threshold) — higher is better |
| **Precision** | Of all the things the model flagged, what % were actually real detections (not false alarms) |
| **Recall** | Of all actual real objects in the scene, what % did the model find (not miss) |

---

## Phase 5: The Spatial Analysis Engine
> *Cell 21: The core rule-based intelligence — virtual fences, restricted zones, vehicle tracking.*

---

### 🟦 Cell 21 — Define the Geometry & Tracking Classes

This is the most important cell. It defines three classes that give IBVAP its **spatial intelligence**.

#### Part A: Line Intersection Math (Virtual Fence)

```python
def ccw(A, B, C):
    return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])

def intersect(A, B, C, D):
    return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)
```

> **Simple explanation:** Imagine drawing a red line across the camera feed. `intersect()` checks if a person's walking path (a line from where they were to where they are now) crosses that red line. If it does — that's a **PERIMETER BREACH**.

#### Part B: VirtualFence Class

```python
class VirtualFence:
    def update(self, track_id, bbox):
        bottom_center = ((x1 + x2) / 2, y2)       # Foot position of the person
        self.track_history[track_id].append(bottom_center)  # Record movement history

        # Check if last movement crossed the fence line
        if intersect(prev_pt, curr_pt, self.line_p1, self.line_p2):
            self.breaches.add(track_id)
            return True  # ALERT!
```

> Uses the foot position (bottom center of the bounding box) to track exactly where a person is stepping, and fires an alert the **first time** they cross the line.

#### Part C: RestrictedZone Class

```python
class RestrictedZone:
    def update(self, track_id, bbox, frame_idx):
        is_inside = cv2.pointPolygonTest(self.polygon, (cx, cy), False) >= 0
        
        if is_inside:
            dwell = frame_idx - self.entry_frames[track_id]
            if dwell >= self.dwell_threshold:
                alerts.append({"type": "LOITERING_ALERT", ...})
        
        speed = np.sqrt((cx - prev_cx)**2 + (cy - prev_cy)**2)
        if speed > self.speed_threshold:
            alerts.append({"type": "SUDDEN_MOVEMENT", ...})
```

| Feature | Logic |
|---|---|
| **Loitering Detection** | If a person stays inside the polygon for more frames than the threshold → alert |
| **Sudden Movement** | If a person's speed between frames exceeds the threshold → alert (running, fleeing) |
| `pointPolygonTest` | OpenCV function that checks if a point is inside a polygon — like asking "is this person inside the restricted zone?" |

#### Part D: VehicleTracker Class

```python
class VehicleTracker:
    def update_trajectory(self, track_id, bbox, frame_idx):
        self.trajectories[track_id].append((cx, cy))
        
        dx = trajectories[-1][0] - trajectories[0][0]   # Horizontal movement
        dy = trajectories[-1][1] - trajectories[0][1]   # Vertical movement
        direction = "RIGHT" or "LEFT" or "UP" or "DOWN"

        if direction == "DOWN":  # Wrong-way vehicle
            events.append({"type": "WRONG_WAY_VEHICLE"})
```

> Tracks where a vehicle has been for the last 30 frames. If it's moving "DOWN" (i.e., toward the camera / into border territory) — it triggers a **WRONG_WAY_VEHICLE** alert.

---

## Phase 6: ANPR & Privacy Systems
> *Cells 22–23: Reading number plates and blurring faces.*

---

### 🟦 Cell 22 — License Plate Recognition (ANPR) + Face Redaction

```python
# Load EasyOCR text recognition engine
reader = easyocr.Reader(['en'], gpu=True)

# Load dedicated license plate detector
plate_detector = YOLO(plate_model_path)

# Load dedicated face detector
face_detector = YOLO(face_model_path)
```

**How ANPR works (two-stage pipeline):**
1. `plate_detector` scans the full frame and draws a box around any visible number plates
2. That plate crop is extracted and passed to `reader.readtext()` (EasyOCR)
3. The text is cleaned up (removes non-alphanumeric characters) and stored in a log

```python
def extract_plate_text(frame, bbox):
    cropped = frame[y1:y2, x1:x2]          # Crop just the plate region
    gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
    results = reader.readtext(gray)          # Run OCR
    clean = re.sub(r'[^A-Z0-9]', '', text.upper())  # Keep only letters & numbers
```

**How face redaction works:**
```python
def redact_faces(frame):
    for box in results.boxes.xyxy:
        roi = frame[y1:y2, x1:x2]           # Crop the face region
        frame[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (51, 51), 30)  # Blur it
```

> **Why blur faces?** The MoHA PS explicitly allows face detection for flagged individuals. For non-flagged persons passing through the camera view, IBVAP automatically blurs them — making it **GDPR-compliant and privacy-respecting** out of the box.

---

### 🟦 Cell 23 — CLAHE Night Vision Enhancement

```python
def apply_clahe(frame):
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)  # Convert to LAB color space
    l, a, b = cv2.split(lab)                       # Split into Lightness + Color channels
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)                            # Enhance only the brightness channel
    return cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)  # Rebuild color image
```

| Step | What it does |
|---|---|
| Convert to LAB | Separates brightness (L) from color (A, B) — allows enhancing brightness without washing out color |
| CLAHE on L channel | Boosts contrast in small local tiles of the image — brightens dark shadows without over-exposing bright areas |
| `clipLimit=3.0` | Prevents noise from being amplified too aggressively |
| Merge back | Recombines the enhanced brightness with the original colors |

> **Why not just increase brightness?** Simply brightening an image makes the whole frame look grey and washed out. CLAHE is smart — it locally enhances contrast, making dark corners visible while keeping bright areas normal.

---

## Phase 7: The Full IBVAP Processing Pipeline
> *Cell 24: Combines everything into one unified function that processes a video.*

---

### 🟦 Cell 24 — `run_ibvap()` — The Main Engine

This is the function that ties every module together. It reads a video file, processes each frame, and writes an annotated output video.

```python
def run_ibvap(input_path, output_path, camera_id="BOP-01"):
    cap = cv2.VideoCapture(input_path)   # Open the video file (or RTSP stream)
    ...
    fence = VirtualFence(...)            # Draw the virtual perimeter line
    zone = RestrictedZone(...)           # Define the restricted polygon zone
    tracker = VehicleTracker()           # Initialize vehicle direction tracker
    event_log = []                       # List to store all security alerts
```

**The main loop — processes one frame at a time:**

```python
while cap.isOpened():
    ret, frame = cap.read()   # Read the next video frame

    # Step 1: Auto Night Detection
    is_night = np.mean(cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)) < 90
    if is_night: frame = apply_clahe(frame)   # Enhance if dark

    # Step 2: Detect & Track Objects
    results = detector.track(frame, persist=True, tracker="bytetrack.yaml")
    
    for box, tid, cls_id in zip(boxes, track_ids, classes):
        
        # Step 3: Check Virtual Fence
        if fence.update(tid, box):
            event_log.append({"event_type": "PERIMETER_BREACH", "severity": "CRITICAL"})

        # Step 4: Check Restricted Zone
        for alert in zone.update(tid, box, frame_idx):
            event_log.append({"event_type": alert["type"], "severity": "WARNING"})

        # Step 5: For Vehicles — ANPR + Wrong Way Detection
        if cls_id in vehicle_classes:
            dir_status, v_events = tracker.update_trajectory(tid, box, frame_idx)

    # Step 6: Redact Faces (Privacy Mode)
    frame = redact_faces(frame)
    
    out.write(frame)   # Write the annotated frame to output video
```

> **`tracker="bytetrack.yaml"`** — This is ByteTrack. Instead of just detecting objects in each frame independently, ByteTrack gives each person/vehicle a **persistent ID** (e.g., "Person #7") that stays attached to them throughout the entire video, even if they are briefly hidden behind something.

---

## Phase 8: Dataset Expansion (LLVIP)
> *Cells 28–33: Add an infrared-adjacent pedestrian dataset to improve night detection.*

---

### 🟦 Cells 28–29 — Normalize ExDark Labels and Merge into Master Dataset

ExDark has 11+ classes (like "bicycle", "cat", "boat"), but IBVAP only cares about **6**: person, bicycle, car, motorcycle, bus, truck. These cells:
1. **Remap** class IDs to the IBVAP numbering (e.g., ExDark's class 10 "People" → IBVAP class 0 "person")
2. **Delete** any image/label pairs that contain only irrelevant objects (e.g., boats)
3. **Merge** the cleaned dataset into a unified `ibvap_master/` folder

---

### 🟦 Cell 30 — Download LLVIP Dataset

```python
project = rf.workspace("pinakpanighosh3-gmail-com").project("llvip-nhnrm")
dataset = version.download("yolov8")
```

> **LLVIP (Low-Light Visible-Infrared Paired Dataset)** is a dataset specifically designed to simulate what IR/thermal cameras see at night. Adding it alongside ExDark gives IBVAP double coverage of night-time scenarios — exactly what border posts need between midnight and dawn.

---

### 🟦 Cells 31–32 — Normalize LLVIP and Merge

Same process as ExDark — all LLVIP labels are normalized to class 0 (person) and merged into the master dataset.

---

### 🟦 Cell 33 — Create the Master `data.yaml` File

```yaml
names:
  0: person
  1: bicycle
  2: car
  3: motorcycle
  4: bus
  5: truck
```

This YAML file is the "table of contents" for the merged training dataset, telling YOLO exactly what objects to learn to detect.

---

## Phase 9: Final Model Training
> *Cells 34–36: Train the definitive IBVAP model on the combined ExDark + LLVIP dataset.*

---

### 🟦 Cell 34 — Train the Final IBVAP Detector

```python
model = YOLO("yolov8n.pt")   # Start from a clean base

results = model.train(
    data=f"{BASE}/datasets/ibvap_master/data.yaml",  # The merged dataset
    epochs=50, imgsz=640, batch=16, patience=10
)

!cp .../best.pt {BASE}/models/ibvap_detector.pt   # Save as the final model
```

> This is the definitive training run — the model learns from both ExDark (dark visible-spectrum) and LLVIP (IR-simulated night) simultaneously. The resulting `ibvap_detector.pt` is what powers the live backend server.

---

### 🟦 Cells 35–36 — Load the Final Model

```python
detector = YOLO(f"{BASE}/models/ibvap_detector.pt")
```

Swaps out the intermediate ExDark-only model for the final, superior combined model.

---

## Phase 10: Benchmarking & Demo
> *Cells 37–44: Measure performance, run demo videos, and test different geometric configurations.*

---

### 🟦 Cell 37 — Benchmark Across Scenarios

Runs the pipeline on multiple test clips (day, night, vehicles, crowded area) and compiles a performance table:

```
| Scenario        | Avg FPS | PERIMETER_BREACH | LOITERING_ALERT |
|-----------------|---------|------------------|-----------------|
| Day Traffic     | 24.1    | 3                | 1               |
| Night Synthetic | 21.8    | 5                | 2               |
```

---

### 🟦 Cell 38 — Display Annotated Video + Audit Log in Colab

```python
!ffmpeg -i {source_video} -vcodec libx264 {browser_video}  # Convert for browser
display(HTML(f'<video ...>{video_encoded}</video>'))        # Play video inline
```

> Browsers can't play videos in the OpenCV format (`.avi`/`mp4v`). `ffmpeg` converts it to standard H.264 format so it plays directly inside the Colab notebook.

---

### 🟦 Cells 39–40 — Download Real CCTV Test Clips and Run Demo

Downloads four different video scenarios and runs the full IBVAP pipeline on each:

```python
SELECTED_CLIP = "crowd_cctv.mp4"
run_ibvap(input_clip, raw_output)
```

---

### 🟦 Cells 41–44 — Geometry Configuration Testing

These cells test three different boundary layout presets:

| Layout | Fence Type | Zone Type |
|---|---|---|
| `diagonal_split` | Diagonal line top-left to bottom-right | Right-side trapezoid |
| `center_quadrant` | Horizontal line at mid-screen | Central square |
| `perimeter_corridor` | Vertical line at left third | Lower-left corridor |

> **Why?** Every BOP camera angle is different. This module proves that IBVAP's virtual boundaries are **fully configurable** — adapting to any camera placement without any code changes.

---

## Phase 11: License Plate Model Training
> *Cells 45–51: Train a custom ANPR model.*

---

### 🟦 Cells 45–50 — Train a Dedicated License Plate Detector

Downloads the Roboflow license plate dataset and trains a separate YOLOv8 model specifically for detecting plate regions:

```python
plate_model = YOLO("yolov8n.pt")

results = plate_model.train(
    data=yaml_path,
    epochs=50,
    imgsz=640
)
```

> A general object detector (trained on people and cars) is poor at finding the small, rectangular plate region. This dedicated plate model is trained exclusively on thousands of plate images, making it far more accurate at cropping the exact plate area for EasyOCR to read.

---

## Quick Reference: IBVAP's Alert Types

| Alert | Trigger | Severity |
|---|---|---|
| `PERIMETER_BREACH` | Person/vehicle crosses the virtual fence line | 🔴 CRITICAL |
| `LOITERING_ALERT` | Object stays inside restricted zone beyond time threshold | 🟡 WARNING |
| `SUDDEN_MOVEMENT` | Object speed exceeds pixel threshold between frames | 🟡 WARNING |
| `WRONG_WAY_VEHICLE` | Vehicle trajectory direction is flagged as wrong-way | 🔴 CRITICAL |
| `ANPR_DETECT` | New license plate text successfully extracted | 🔵 INFO |

---

## The IBVAP Stack at a Glance

```
Video Feed (RTSP / MP4)
         │
    ┌────▼────┐
    │  CLAHE  │ ← Auto night-light enhancement (if dark)
    └────┬────┘
         │
    ┌────▼────────────┐
    │  YOLOv8n        │ ← Detects: person, car, bus, motorcycle, bicycle, truck
    │  + ByteTrack    │ ← Gives persistent IDs across all frames
    └────┬────────────┘
         │
    ┌────▼────────────────────────────────────┐
    │  Spatial Engine                         │
    │  ├── VirtualFence (line crossing)       │
    │  ├── RestrictedZone (loitering/speed)   │
    │  └── VehicleTracker (direction)         │
    └────┬────────────────────────────────────┘
         │
    ┌────▼──────────────────┐
    │  ANPR Pipeline        │
    │  ├── Plate YOLO crop  │
    │  └── EasyOCR read     │
    └────┬──────────────────┘
         │
    ┌────▼────────┐
    │ Face Redact │ ← Gaussian blur on non-flagged faces (Privacy)
    └────┬────────┘
         │
    ┌────▼──────────────────────────────────────┐
    │  Outputs                                  │
    │  ├── Annotated Video (bounding boxes)     │
    │  ├── JSON Alert Log (timestamped events)  │
    │  └── FastAPI WebSocket (real-time push)   │
    └───────────────────────────────────────────┘
```

---

*"IBVAP doesn't ask the border to buy new eyes — it teaches the eyes it already has to think."*
