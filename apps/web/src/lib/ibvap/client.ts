/**
 * IBVAP Backend API client
 * Base URL is read from NEXT_PUBLIC_IBVAP_URL (defaults to http://localhost:8000)
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_IBVAP_URL ?? "http://localhost:8000";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  engine_ready: boolean;
}

export interface AlertEvent {
  camera_id: string;
  timestamp: string;
  frame: number;
  object_type: string;
  track_id: number;
  event_type:
    | "PERIMETER_BREACH"
    | "LOITERING_ALERT"
    | "SUDDEN_MOVEMENT"
    | "WRONG_WAY_VEHICLE"
    | "ANPR_DETECT"
    | string;
  severity: "CRITICAL" | "WARNING" | "INFO" | string;
  details?: Record<string, unknown>;
}

export interface FenceConfig {
  p1: [number, number];
  p2: [number, number];
}

export interface ZoneConfig {
  polygon: [number, number][];
  dwell_threshold_frames: number;
  speed_threshold_px: number;
}

export interface GeometryUpdate {
  camera_id?: string;
  fence?: FenceConfig;
  zone?: ZoneConfig;
}

// ─── REST helpers ─────────────────────────────────────────────────────────────

/** GET /health */
export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

/** GET /api/v1/alerts */
export async function fetchAlerts(limit = 50): Promise<AlertEvent[]> {
  const res = await fetch(`${BASE_URL}/api/v1/alerts?limit=${limit}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

/** POST /api/v1/config/geometry */
export async function updateGeometry(
  payload: GeometryUpdate
): Promise<{ status: string; message: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/config/geometry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update geometry");
  return res.json();
}

/** Returns the full MJPEG stream URL (used directly in <img src="..."> ) */
export function getStreamUrl(source = "videos/day.mp4"): string {
  return `${BASE_URL}/api/v1/stream?source=${encodeURIComponent(source)}`;
}

/** Returns the WebSocket URL for /ws/alerts */
export function getAlertsWsUrl(): string {
  return BASE_URL.replace(/^http/, "ws") + "/ws/alerts";
}
