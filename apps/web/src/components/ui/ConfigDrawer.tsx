"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  Crosshair,
  Plus,
  Radio,
  Save,
  Settings,
  Target,
  X,
} from "lucide-react";

type Point = { label: string; x: number; y: number };

const INITIAL_POINTS: Point[] = [
  { label: "Node 1 (Top-L)", x: 168, y: 628 },
  { label: "Node 2 (Top-R)", x: 604, y: 368 },
  { label: "Node 3 (Btm-R)", x: 462, y: 628 },
  { label: "Node 4 (Btm-L)", x: 180, y: 668 },
];

function NumberField({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center justify-between rounded-md border border-primary/20 bg-[#111111] px-2 py-1.5">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <input
        aria-label={label}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-12 bg-transparent text-right font-mono text-[10px] text-foreground outline-none"
      />
      <span className="text-[8px] text-muted-foreground">px</span>
    </label>
  );
}

export default function ConfigDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [camera, setCamera] = useState("BOP-01 — North Gate (Sector Alpha)");
  const [direction, setDirection] = useState("Bi-Directional");
  const [threshold, setThreshold] = useState(78);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function updatePoint(index: number, axis: "x" | "y", value: number) {
    setSaved(false);
    setPoints((current) =>
      current.map((point, pointIndex) =>
        pointIndex === index ? { ...point, [axis]: value } : point,
      ),
    );
  }

  function publishLive() {
    setSaved(true);
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close configuration panel"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/65 backdrop-blur-[2px]"
      />

      <aside
        id="configuration-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="configuration-drawer-title"
        className={`absolute right-0 top-0 flex h-full w-full max-w-[25rem] flex-col border-l border-primary/20 bg-[#0b0b0b] text-foreground shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <div>
              <p id="configuration-drawer-title" className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Settings
              </p>
              <p className="text-[9px] text-muted-foreground">Live surveillance controls</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close configuration panel"
            onClick={onClose}
            className="rounded-md border border-primary/20 p-1.5 text-muted-foreground transition hover:border-primary/60 hover:bg-primary/10 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <section className="rounded-lg border border-primary/20 bg-[#151515] p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Radio className="h-3 w-3 text-primary" />
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-primary">Active surveillance camera</p>
              </div>
              <span className="flex items-center gap-1 font-mono text-[8px] text-primary"><span className="h-1 w-1 rounded-full bg-primary" />rtsp-h264-stream</span>
            </div>
            <label className="relative block">
              <span className="sr-only">Select active camera</span>
              <select
                value={camera}
                onChange={(event) => setCamera(event.target.value)}
                className="w-full appearance-none rounded-md border border-primary/25 bg-[#111111] px-2 py-2 pr-7 text-[10px] text-foreground outline-none focus:border-primary"
              >
                {["BOP-01 — North Gate (Sector Alpha)", "BOP-02 — Perimeter West", "BOP-03 — River Checkpoint", "BOP-04 — East Watchtower"].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3 w-3 text-primary" />
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 rounded-md bg-[#111111] p-2 font-mono text-[8px] text-muted-foreground">
              <span>IP ADDR:<b className="block font-normal text-foreground">192.168.10.41</b></span>
              <span>ENCODER:<b className="block font-normal text-foreground">H.264 Main</b></span>
              <span>LATENCY:<b className="block font-normal text-primary">~45 ms</b></span>
            </div>
          </section>

          <section className="mt-2 rounded-lg border border-primary/20 bg-[#151515] p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crosshair className="h-3 w-3 text-warning" />
                <h3 className="text-[10px] font-semibold text-foreground">Virtual fence tripwire</h3>
              </div>
              <span className="rounded bg-warning/15 px-1.5 py-1 text-[8px] font-bold uppercase text-warning">Trigger: breach</span>
            </div>
            <p className="text-[9px] leading-4 text-muted-foreground">A bidirectional tripwire dispatches real-time alerts when an object crosses the boundary.</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[8px]">
              <span className="font-mono text-primary">Start Point <em className="text-muted-foreground not-italic">[Point A]</em></span>
              <span className="text-right font-mono text-muted-foreground">Origin [X, Y]</span>
              <NumberField label="X" value={0} onChange={() => setSaved(false)} />
              <NumberField label="Y" value={340} onChange={() => setSaved(false)} />
              <span className="font-mono text-primary">End Point <em className="text-muted-foreground not-italic">[Point B]</em></span>
              <span className="text-right font-mono text-muted-foreground">Termination [X, Y]</span>
              <NumberField label="X" value={1280} onChange={() => setSaved(false)} />
              <NumberField label="Y" value={340} onChange={() => setSaved(false)} />
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground">Alert crossing direction</p>
            <div className="mt-1 grid grid-cols-3 gap-1">
              {["Bi-Directional", "Ingress Only (+)", "Egress Only (-)"].map((option) => (
                <button key={option} type="button" onClick={() => { setDirection(option); setSaved(false); }} className={`rounded border px-1 py-1.5 text-[8px] font-semibold transition ${direction === option ? "border-primary bg-primary text-primary-foreground" : "border-primary/20 bg-[#111111] text-muted-foreground hover:border-primary/50"}`}>{option}</button>
              ))}
            </div>
            <label className="mt-2 block text-[9px] text-muted-foreground">
              Breach confidence threshold <span className="float-right font-mono text-primary">{threshold}%</span>
              <input aria-label="Breach confidence threshold" type="range" min="50" max="100" value={threshold} onChange={(event) => { setThreshold(Number(event.target.value)); setSaved(false); }} className="mt-1 w-full accent-primary" />
            </label>
          </section>

          <section className="mt-2 rounded-lg border border-primary/20 bg-[#151515] p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Target className="h-3 w-3 text-primary" />
                <h3 className="text-[10px] font-semibold text-foreground">Restricted polygon zone</h3>
              </div>
              <span className="rounded bg-primary/15 px-1.5 py-1 text-[8px] font-bold uppercase text-primary">Zone: ZONE-01</span>
            </div>
            <div className="space-y-1.5">
              {points.map((point, index) => (
                <div key={point.label} className="grid grid-cols-[1fr_1fr_1fr] items-center gap-1 rounded-md border border-primary/15 bg-[#111111] px-2 py-1">
                  <span className="text-[8px] font-medium text-primary">{point.label}</span>
                  <NumberField label="X" value={point.x} onChange={(value) => updatePoint(index, "x", value)} />
                  <NumberField label="Y" value={point.y} onChange={(value) => updatePoint(index, "y", value)} />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPoints((current) => [...current, { label: `Node ${current.length + 1}`, x: 0, y: 0 }])} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-primary/30 py-2 text-[9px] font-semibold text-primary transition hover:bg-primary/10">
              <Plus className="h-3 w-3" /> Add polygon coordinate vertex
            </button>
          </section>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-primary/20 bg-[#070707] p-3">
          <button type="button" onClick={onClose} className="rounded-md border border-primary/20 px-2 py-2 text-[9px] font-semibold text-muted-foreground transition hover:border-primary/50">Discard</button>
          <button type="button" onClick={() => setSaved(false)} className="flex items-center justify-center gap-1 rounded-md border border-warning/30 px-2 py-2 text-[9px] font-semibold text-warning transition hover:bg-warning/10"><CircleHelp className="h-3 w-3" /> Test Trigger</button>
          <button type="button" onClick={publishLive} className="flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-2 text-[9px] font-bold text-primary-foreground transition hover:opacity-90"><Save className="h-3 w-3" /> {saved ? "Published" : "Publish Live"}</button>
        </div>
      </aside>
    </div>
  );
}
