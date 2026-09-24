"use client";

import { useState } from "react";
import { SlidersHorizontal, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { updateGeometry } from "@/lib/ibvap/client";

type FormStatus = "idle" | "saving" | "success" | "error";

export default function GeometryConfig() {
  // Fence — two points
  const [fence, setFence] = useState({
    p1x: 0, p1y: 360,
    p2x: 1280, p2y: 360,
  });

  // Zone — polygon as textarea (JSON array of [x,y] pairs)
  const [polygonRaw, setPolygonRaw] = useState(
    JSON.stringify([[320, 200], [960, 200], [960, 600], [320, 600]], null, 2)
  );
  const [dwellThreshold, setDwellThreshold] = useState(25);
  const [speedThreshold, setSpeedThreshold] = useState(30.0);
  const [cameraId, setCameraId] = useState("BOP-01");

  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    let polygon: [number, number][];
    try {
      polygon = JSON.parse(polygonRaw);
      if (!Array.isArray(polygon) || polygon.some((p) => !Array.isArray(p) || p.length !== 2)) {
        throw new Error("Polygon must be an array of [x, y] pairs.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid polygon JSON.");
      setStatus("error");
      return;
    }

    try {
      await updateGeometry({
        camera_id: cameraId,
        fence: {
          p1: [fence.p1x, fence.p1y],
          p2: [fence.p2x, fence.p2y],
        },
        zone: {
          polygon,
          dwell_threshold_frames: dwellThreshold,
          speed_threshold_px: speedThreshold,
        },
      });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Request failed.");
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Camera ID */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Camera</h3>
        </div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Camera ID
        </label>
        <input
          type="text"
          value={cameraId}
          onChange={(e) => setCameraId(e.target.value)}
          className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="BOP-01"
        />
      </div>

      {/* Virtual Fence */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Virtual Fence Line
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          A horizontal line defined by two pixel coordinates. Objects crossing it trigger a{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">PERIMETER_BREACH</code> alert.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              { key: "p1x", label: "Point 1 — X" },
              { key: "p1y", label: "Point 1 — Y" },
              { key: "p2x", label: "Point 2 — X" },
              { key: "p2y", label: "Point 2 — Y" },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <input
                type="number"
                value={fence[key]}
                onChange={(e) =>
                  setFence((f) => ({ ...f, [key]: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Restricted Zone */}
      <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Restricted Zone Polygon
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          JSON array of{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">[x, y]</code>{" "}
          pixel pairs defining the restricted polygon.
        </p>

        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Polygon Points (JSON)
        </label>
        <textarea
          rows={5}
          value={polygonRaw}
          onChange={(e) => setPolygonRaw(e.target.value)}
          spellCheck={false}
          className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Dwell Threshold (frames)
            </label>
            <input
              type="number"
              min={1}
              value={dwellThreshold}
              onChange={(e) => setDwellThreshold(Number(e.target.value))}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Frames before a{" "}
              <code className="font-mono text-[11px]">LOITERING_ALERT</code>
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Speed Threshold (px / frame)
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={speedThreshold}
              onChange={(e) => setSpeedThreshold(Number(e.target.value))}
              className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Pixels / frame above which a{" "}
              <code className="font-mono text-[11px]">SUDDEN_MOVEMENT</code> fires
            </p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "saving"}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
        >
          {status === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {status === "saving" ? "Saving…" : "Apply Geometry"}
        </button>

        {status === "success" && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--positive)]">
            <CheckCircle2 className="h-4 w-4" />
            Geometry updated successfully
          </span>
        )}
        {status === "error" && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--negative)]">
            <AlertTriangle className="h-4 w-4" />
            {errorMsg || "Something went wrong"}
          </span>
        )}
      </div>
    </form>
  );
}
