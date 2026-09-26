"use client";

import {
  Activity,
  Maximize2,
  MoreHorizontal,
  WifiOff,
} from "lucide-react";

type CameraStatus = "live" | "attention" | "offline";

export type CameraFeed = {
  id: string;
  sector: string;
  location: string;
  status: CameraStatus;
  fps?: number;
  latency?: number;
  alert?: string;
  tone: string;
};

export const CAMERAS: CameraFeed[] = [
  { id: "BOP-01", sector: "Sector Alpha", location: "North Gate", status: "live", fps: 30, latency: 18, tone: "from-emerald-950 via-slate-950 to-sky-950" },
  { id: "BOP-02", sector: "Sector Alpha", location: "Perimeter West", status: "live", fps: 29, latency: 21, tone: "from-slate-950 via-teal-950 to-emerald-950" },
  { id: "BOP-03", sector: "Sector Bravo", location: "Vehicle Checkpoint", status: "attention", fps: 30, latency: 24, alert: "Vehicle detected", tone: "from-slate-950 via-amber-950 to-stone-950" },
  { id: "BOP-04", sector: "Sector Bravo", location: "East Fence", status: "live", fps: 30, latency: 17, tone: "from-cyan-950 via-slate-950 to-emerald-950" },
  { id: "BOP-05", sector: "Sector Charlie", location: "River Crossing", status: "live", fps: 28, latency: 31, tone: "from-blue-950 via-slate-950 to-cyan-950" },
  { id: "BOP-06", sector: "Sector Charlie", location: "South Trail", status: "offline", tone: "from-slate-900 via-zinc-950 to-slate-950" },
  { id: "BOP-07", sector: "Sector Delta", location: "Watch Tower 1", status: "live", fps: 30, latency: 19, tone: "from-emerald-950 via-teal-950 to-slate-950" },
  { id: "BOP-08", sector: "Sector Delta", location: "Watch Tower 2", status: "attention", fps: 29, latency: 26, alert: "Zone activity", tone: "from-rose-950 via-slate-950 to-violet-950" },
  { id: "BOP-09", sector: "Sector Echo", location: "Service Road", status: "live", fps: 30, latency: 16, tone: "from-sky-950 via-slate-950 to-emerald-950" },
  { id: "BOP-10", sector: "Sector Echo", location: "South Gate", status: "live", fps: 29, latency: 22, tone: "from-teal-950 via-slate-950 to-blue-950" },
];

function CameraPreview({ camera }: { camera: CameraFeed }) {
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${camera.tone}`}>
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,.28)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.28)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="absolute -left-8 top-[42%] h-px w-[115%] -rotate-6 bg-white/20" />
      <div className="absolute bottom-[16%] left-[14%] h-[34%] w-[23%] rounded-sm border-2 border-emerald-300/75 shadow-[0_0_18px_rgba(110,231,183,.24)]" />
      <div className="absolute bottom-[16%] left-[14%] -translate-y-full rounded-t-sm bg-emerald-300 px-1.5 py-0.5 font-mono text-[8px] font-bold text-emerald-950">
        PERSON 94%
      </div>
      <div className="absolute right-[17%] top-[28%] h-[18%] w-[28%] rounded-sm border-2 border-sky-300/65" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/75 to-transparent" />
      {camera.status === "offline" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 text-white/75">
          <WifiOff className="h-7 w-7" />
          <span className="text-[11px] font-semibold uppercase">Offline</span>
        </div>
      )}
    </div>
  );
}

export default function CameraWall({ selectedId, onSelect }: { selectedId: string; onSelect: (camera: CameraFeed) => void }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card/30">
      <div className="grid max-h-[39rem] grid-cols-1 gap-3 overflow-y-auto p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [scrollbar-color:var(--primary)_transparent]">
        {CAMERAS.map((camera) => {
          const selected = selectedId === camera.id;

          return (
            <button
              type="button"
              key={camera.id}
              onClick={() => onSelect(camera)}
              className={`group relative aspect-[1.35/1] overflow-hidden rounded-lg border bg-[#080808] text-left shadow-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                selected
                  ? "border-primary ring-1 ring-primary/60"
                  : camera.status === "attention"
                    ? "border-primary hover:shadow-lg"
                    : "border-border hover:border-primary/65 hover:shadow-lg"
              }`}
              aria-pressed={selected}
              aria-label={`Select ${camera.id}, ${camera.location}`}
            >
              <CameraPreview camera={camera} />

              <div className="absolute inset-x-0 top-0 z-10 flex h-9 items-center gap-2 bg-black/75 px-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${camera.status === "live" ? "bg-emerald-500" : "bg-primary"}`} />
                <span className="truncate text-[11px] font-semibold tracking-tight text-white">
                  {camera.id} - {camera.location}
                </span>
              </div>

              <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="rounded-md bg-black/60 p-1 text-white/85"><Maximize2 className="h-3 w-3" /></span>
                <span className="rounded-md bg-black/60 p-1 text-white/85"><MoreHorizontal className="h-3 w-3" /></span>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-2 p-2 text-white">
                <div className="min-w-0">
                  <p className="rounded bg-black/75 px-1.5 py-1 font-mono text-[9px] font-medium">10:40:{camera.id.slice(-1).padStart(2, "0")} WIB</p>
                </div>
                {camera.status === "offline" ? (
                  <span className="text-[9px] font-medium text-white/60">Signal unavailable</span>
                ) : camera.alert ? (
                  <span className="rounded bg-primary px-2 py-1 text-[9px] font-bold uppercase text-white">Alert</span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-white/75"><Activity className="h-2.5 w-2.5 text-emerald-300" />Live</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border/70 px-4 py-2.5 text-xs text-muted-foreground">
        <span>Selected: <strong className="font-semibold text-foreground">{selectedId}</strong></span>
        <span>UI preview mode · stream assignment comes next</span>
      </div>
    </section>
  );
}
