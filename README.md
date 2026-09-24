# SentinelX

> **Intelligent Behaviour & Vehicle Analysis Platform (IBVAP)**  
> Real-time CCTV surveillance with perimeter breach detection, loitering alerts, wrong-way vehicle tracking, and ANPR.

📖 **[Full Architecture & Technical Deep Dive →](ARCHITECTURE.md)**

---

## Monorepo Layout

```
SentinelX/
├── apps/
│   ├── web/          # Next.js 16 frontend  (React 19 · Tailwind 4 · TypeScript)
│   └── api/          # FastAPI backend       (Python · YOLOv8 · EasyOCR)
├── fact-check/       # Research & presentation docs
├── IBVAP.ipynb       # Exploration notebook
├── package.json      # Root convenience scripts
└── .gitignore
```

---

## Quick Start

### 1 — Backend (FastAPI)

```bash
cd apps/api

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at **http://localhost:8000**  
Interactive docs: **http://localhost:8000/docs**

### 2 — Frontend (Next.js)

```bash
# From the repo root
npm run dev          # starts apps/web on http://localhost:3000

# or directly from apps/web/
cd apps/web && npm run dev
```

### Run both simultaneously (two terminals)

```bash
# Terminal 1 — API
cd apps/api && uvicorn app.main:app --reload --port 8000

# Terminal 2 — Web
npm run dev    # (from repo root)
```

---

## Backend API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Engine readiness check |
| `GET` | `/api/v1/alerts?limit=50` | Fetch alert history |
| `POST` | `/api/v1/config/geometry` | Update virtual fence & restricted zone |
| `GET` | `/api/v1/stream?source=...` | MJPEG live video stream |
| `WS` | `/ws/alerts` | Real-time alert push |

### Alert Event Types

| Event | Severity |
|-------|----------|
| `PERIMETER_BREACH` | CRITICAL |
| `WRONG_WAY_VEHICLE` | CRITICAL |
| `LOITERING_ALERT` | WARNING |
| `SUDDEN_MOVEMENT` | WARNING |
| `ANPR_DETECT` | INFO |

---

## Root Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js frontend dev server |
| `npm run build` | Production build of the frontend |
| `npm run start` | Start the production frontend |
| `npm run dev:api` | Start the FastAPI backend (requires venv activated) |

---

## Environment Variables

Copy `apps/web/.env.local` and set:

```env
NEXT_PUBLIC_IBVAP_URL=http://localhost:8000
```

For Supabase auth, also set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Auth | Supabase SSR |
| Backend | FastAPI, Python 3.11+ |
| CV Models | YOLOv8 (Ultralytics), EasyOCR |
| Tracking | ByteTrack |
| Streaming | MJPEG over HTTP, WebSocket |
