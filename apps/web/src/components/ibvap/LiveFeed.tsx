"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ShieldAlert,
  Clock,
  Car,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
  Video,
  Play,
  Activity,
} from "lucide-react";
import { getStreamUrl } from "@/lib/ibvap/client";

const SOURCES = [
  { label: "Crowd Monitoring (BOP-01)", value: "videos/crowd_cctv.mp4" },
  { label: "Night Vision (Low Light)", value: "videos/night_real.mp4" },
  { label: "Traffic & Vehicles", value: "videos/traffic_cctv.mp4" },
  { label: "Interactive Simulation", value: "simulated" },
];

type StreamState = "connecting" | "live" | "error";

export default function LiveFeed() {
  const [source, setSource] = useState(SOURCES[0].value);
  const [streamState, setStreamState] = useState<StreamState>("connecting");
  const [fullscreen, setFullscreen] = useState(false);
  const [key, setKey] = useState(0); // bump to force remount
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isSimulated = source === "simulated";
  const streamUrl = getStreamUrl(source);

  // Fullscreen toggle
  useEffect(() => {
    const handler = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Canvas simulation when source is "simulated" or backend is offline
  useEffect(() => {
    if (!isSimulated) return;

    setStreamState("live");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    // Simulated moving objects
    const objects = [
      { id: 101, type: "person", x: 120, y: 180, vx: 1.2, vy: 0.3, w: 32, h: 64, color: "#4fae8c" },
      { id: 102, type: "car", x: 420, y: 240, vx: -2.5, vy: 0.1, w: 90, h: 48, color: "#38bdf8" },
      { id: 103, type: "person", x: 260, y: 310, vx: 0.2, vy: -0.4, w: 30, h: 60, color: "#e0745a" },
    ];

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark CCTV background
      ctx.fillStyle = "#0c1411";
      ctx.fillRect(0, 0, w, h);

      // CCTV grid lines
      ctx.strokeStyle = "rgba(79, 174, 140, 0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Virtual Fence Line (Tripwire)
      ctx.save();
      ctx.strokeStyle = "rgba(224, 116, 90, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(40, h * 0.55);
      ctx.lineTo(w - 40, h * 0.55);
      ctx.stroke();
      ctx.fillStyle = "#e0745a";
      ctx.font = "bold 11px monospace";
      ctx.fillText("⚠ VIRTUAL FENCE TRIPWIRE [Y: 260]", 50, h * 0.55 - 8);
      ctx.restore();

      // Draw Restricted Zone Polygon
      ctx.save();
      ctx.fillStyle = "rgba(180, 131, 31, 0.12)";
      ctx.strokeStyle = "rgba(180, 131, 31, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.25);
      ctx.lineTo(w * 0.75, h * 0.25);
      ctx.lineTo(w * 0.8, h * 0.7);
      ctx.lineTo(w * 0.3, h * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#b4831f";
      ctx.font = "10px monospace";
      ctx.fillText("RESTRICTED ZONE (LOITERING ZONE 01)", w * 0.36, h * 0.25 + 16);
      ctx.restore();

      // Update and draw objects
      objects.forEach((obj) => {
        obj.x += obj.vx;
        obj.y += obj.vy;

        // Bounce
        if (obj.x < 40 || obj.x + obj.w > w - 40) obj.vx *= -1;
        if (obj.y < 80 || obj.y + obj.h > h - 40) obj.vy *= -1;

        // Check tripwire collision
        const isBreaching = Math.abs(obj.y + obj.h - h * 0.55) < 15;
        const color = isBreaching ? "#e0745a" : obj.color;

        // Bounding box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);

        // Corner reticles
        const corner = 6;
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(obj.x, obj.y + corner); ctx.lineTo(obj.x, obj.y); ctx.lineTo(obj.x + corner, obj.y);
        // Top-right
        ctx.moveTo(obj.x + obj.w - corner, obj.y); ctx.lineTo(obj.x + obj.w, obj.y); ctx.lineTo(obj.x + obj.w, obj.y + corner);
        // Bottom-left
        ctx.moveTo(obj.x, obj.y + obj.h - corner); ctx.lineTo(obj.x, obj.y + obj.h); ctx.lineTo(obj.x + corner, obj.y + obj.h);
        // Bottom-right
        ctx.moveTo(obj.x + obj.w - corner, obj.y + obj.h); ctx.lineTo(obj.x + obj.w, obj.y + obj.h); ctx.lineTo(obj.x + obj.w, obj.y + obj.h - corner);
        ctx.stroke();

        // Label tag
        ctx.fillStyle = color;
        ctx.fillRect(obj.x, obj.y - 18, obj.w + 24, 18);
        ctx.fillStyle = "#0c1411";
        ctx.font = "bold 9px monospace";
        ctx.fillText(
          `${obj.type.toUpperCase()} #${obj.id} 94%`,
          obj.x + 3,
          obj.y - 5
        );

        if (isBreaching) {
          ctx.fillStyle = "#e0745a";
          ctx.font = "bold 9px monospace";
          ctx.fillText("! BREACH !", obj.x, obj.y + obj.h + 12);
        }
      });

      // Scanline effect
      const scanY = (frame * 2.5) % h;
      ctx.fillStyle = "rgba(79, 174, 140, 0.05)";
      ctx.fillRect(0, scanY, w, 4);

      // HUD telemetry
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.font = "10px monospace";
      ctx.fillText(`FPS: 29.8  |  LATENCY: 18ms  |  TRACKS: ${objects.length}`, 16, h - 14);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isSimulated]);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Live Surveillance Feed
          </span>
          {/* connection pill */}
          <span
            className={`ml-1 flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              streamState === "live"
                ? "bg-[color-mix(in_srgb,var(--positive)_15%,transparent)] text-[var(--positive)]"
                : streamState === "error"
                ? "bg-[color-mix(in_srgb,var(--negative)_15%,transparent)] text-[var(--negative)]"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {streamState === "live" ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {streamState === "live"
              ? isSimulated
                ? "SIMULATION"
                : "LIVE STREAM"
              : streamState === "error"
              ? "OFFLINE"
              : "CONNECTING"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* source selector */}
          <select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setStreamState("connecting");
              setKey((k) => k + 1);
            }}
            className="rounded-lg border border-border/70 bg-background/80 px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* refresh */}
          <button
            type="button"
            title="Reconnect"
            onClick={() => {
              setStreamState("connecting");
              setKey((k) => k + 1);
            }}
            className="rounded-lg border border-border/70 bg-background/70 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* fullscreen */}
          <button
            type="button"
            title="Toggle fullscreen"
            onClick={toggleFullscreen}
            className="rounded-lg border border-border/70 bg-background/70 p-1.5 text-muted-foreground transition hover:text-foreground"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Video / Simulation area */}
      <div className="relative aspect-video w-full bg-black">
        {isSimulated ? (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="h-full w-full object-contain"
          />
        ) : (
          /* MJPEG stream from FastAPI */
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={key}
            ref={imgRef}
            src={streamUrl}
            alt="IBVAP live feed"
            className="h-full w-full object-contain"
            onLoad={() => setStreamState("live")}
            onError={() => setStreamState("error")}
          />
        )}

        {/* Overlays when connecting */}
        {streamState === "connecting" && !isSimulated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Connecting to CCTV stream…
            </p>
            <p className="text-xs text-muted-foreground">
              Source: {source}
            </p>
          </div>
        )}

        {/* Overlays when backend stream is offline */}
        {streamState === "error" && !isSimulated && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-6 text-center">
            <WifiOff className="h-9 w-9 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                CCTV Video Stream Unavailable
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                The Python FastAPI backend is not running on port 8000, or the selected video feed is buffering.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSource("simulated");
                setStreamState("live");
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              <Activity className="h-3.5 w-3.5" />
              Switch to Interactive AI Simulation
            </button>
          </div>
        )}

        {/* Timestamp watermark */}
        {streamState === "live" && (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-mono text-white/80">
            <Clock className="h-3 w-3 text-primary" />
            <LiveClock />
          </div>
        )}

        {/* Camera label */}
        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-md bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/90">
          <Car className="h-3.5 w-3.5 text-primary" />
          BOP-01 (SECTOR ALPHA)
        </div>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}
