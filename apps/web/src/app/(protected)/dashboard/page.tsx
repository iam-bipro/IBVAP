"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/ui/Header";
import CameraWall, { CAMERAS, type CameraFeed } from "@/components/ibvap/CameraWall";
import EngineStatus from "@/components/ibvap/EngineStatus";
import {
  fetchAlerts,
  getAlertsWsUrl,
  type AlertEvent,
} from "@/lib/ibvap/client";
import {
  ShieldAlert,
  Siren,
  AlertTriangle,
  Info,
  Car,
  Search,
  Grid3X3,
  List,
  Video,
} from "lucide-react";

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card/80 px-5 py-4 shadow backdrop-blur-xl">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(CAMERAS[0]);

  // Load existing alert history
  const loadHistory = useCallback(async () => {
    try {
      const data = await fetchAlerts(200);
      setAlerts(data);
    } catch {
      // backend not yet running — start empty
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(loadHistory, 0);
    return () => clearTimeout(timeoutId);
  }, [loadHistory]);

  // Real-time WebSocket alerts
  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(getAlertsWsUrl());

      ws.onmessage = (event) => {
        try {
          const alert: AlertEvent = JSON.parse(event.data);
          setAlerts((prev) => [...prev, alert]);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        // Reconnect after 3 s
        reconnectTimeout = setTimeout(connect, 3000);
      };

      // Keep-alive ping every 20 s
      ws.onopen = () => {
        const pingId = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 20_000);
        ws.addEventListener("close", () => clearInterval(pingId));
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  // Derived stats
  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;
  const anprCount = alerts.filter((a) => a.event_type === "ANPR_DETECT").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header monitoring />

      <main className="mx-auto flex max-w-[1800px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Control room / Jakarta</p>
            <h2 className="mt-1 text-2xl font-bold text-foreground">Live camera network</h2>
          </div>
          <EngineStatus />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3">
          <Siren className="h-5 w-5 text-primary" />
          <div className="flex-1"><p className="text-sm font-bold">LIVE ALERT — Perimeter breach detected</p><p className="text-xs text-muted-foreground">BOP-03 · Vehicle Checkpoint · just now</p></div>
          <button type="button" className="rounded-md border border-primary/50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">View alert</button>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={<ShieldAlert className="h-5 w-5 text-primary" />}
            label="Total Alerts"
            value={alerts.length}
            accent="bg-primary/10"
          />
          <StatCard
            icon={<Siren className="h-5 w-5 text-[var(--negative)]" />}
            label="Critical"
            value={criticalCount}
            accent="bg-[color-mix(in_srgb,var(--negative)_12%,transparent)]"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5 text-[var(--warning)]" />}
            label="Warning"
            value={warningCount}
            accent="bg-[color-mix(in_srgb,var(--warning)_12%,transparent)]"
          />
          <StatCard
            icon={<Car className="h-5 w-5 text-[var(--positive)]" />}
            label="ANPR Hits"
            value={anprCount}
            accent="bg-[color-mix(in_srgb,var(--positive)_12%,transparent)]"
          />
        </div>

        {/* ── Camera wall + alert queue ───────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div><h3 className="text-lg font-bold uppercase">Camera grid</h3><p className="text-xs text-muted-foreground">10 connected cameras · live updates</p></div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground"><Search className="h-3.5 w-3.5" /><input aria-label="Search cameras" placeholder="Search cameras" className="w-32 bg-transparent outline-none placeholder:text-muted-foreground" /></label>
            <button type="button" aria-label="Grid view" className="rounded-md bg-primary p-2 text-primary-foreground"><Grid3X3 className="h-4 w-4" /></button>
            <button type="button" aria-label="List view" className="rounded-md border border-border p-2 text-muted-foreground"><List className="h-4 w-4" /></button>
          </div>
        </div>
        <div>
          <CameraWall selectedId={selectedCamera.id} onSelect={setSelectedCamera} />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_28rem]">
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Selected camera</p><h3 className="mt-1 text-lg font-bold">{selectedCamera.id} · {selectedCamera.location}</h3></div><span className={`flex items-center gap-1.5 text-xs font-semibold ${selectedCamera.status === "offline" ? "text-muted-foreground" : selectedCamera.status === "attention" ? "text-primary" : "text-positive"}`}><Video className="h-3.5 w-3.5" /> {selectedCamera.status === "offline" ? "Offline" : selectedCamera.status === "attention" ? "Attention" : `Live · ${selectedCamera.fps} FPS`}</span></div>
            <div className={`relative aspect-[16/6] overflow-hidden rounded-lg border border-border bg-gradient-to-br ${selectedCamera.tone}`}>
              <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:38px_38px]" />
              {selectedCamera.status === "offline" ? <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-xs font-semibold uppercase text-white/70">Signal unavailable</div> : <><div className="absolute left-[28%] top-[24%] h-[48%] w-[17%] border-2 border-primary"><span className="absolute -top-5 left-0 bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">{selectedCamera.alert ? "ALERT" : "PERSON 94%"}</span></div><div className="absolute bottom-3 left-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-white/80">{selectedCamera.id} / {selectedCamera.location.toUpperCase()} / 1080P</div></>}
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Recent events</h3><button type="button" className="text-xs font-semibold text-primary">View all</button></div><div className="space-y-3">{(alerts.length ? alerts.slice(-5).reverse() : [{ event_type: "PERIMETER_BREACH", severity: "CRITICAL", timestamp: new Date().toISOString() } as AlertEvent]).map((alert, index) => <div key={`${alert.timestamp}-${index}`} className="flex items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><span className={`mt-1 h-2 w-2 rounded-full ${alert.severity === "CRITICAL" ? "bg-primary" : "bg-warning"}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{alert.event_type.replaceAll("_", " ")}</p><p className="text-[10px] text-muted-foreground">{new Date(alert.timestamp).toLocaleTimeString()}</p></div></div>)}</div></section>
        </div>

        {/* ── Event-type breakdown ─────────────────────────────────────────── */}
        <EventBreakdown alerts={alerts} />
      </main>
    </div>
  );
}

// ─── Event breakdown bar chart ────────────────────────────────────────────────

const EVENT_META: {
  type: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "PERIMETER_BREACH",
    label: "Perimeter Breach",
    color: "var(--negative)",
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  {
    type: "LOITERING_ALERT",
    label: "Loitering",
    color: "var(--warning)",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  {
    type: "SUDDEN_MOVEMENT",
    label: "Sudden Movement",
    color: "var(--warning)",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  {
    type: "WRONG_WAY_VEHICLE",
    label: "Wrong Way Vehicle",
    color: "var(--negative)",
    icon: <Siren className="h-3.5 w-3.5" />,
  },
  {
    type: "ANPR_DETECT",
    label: "ANPR Detect",
    color: "var(--positive)",
    icon: <Info className="h-3.5 w-3.5" />,
  },
];

function EventBreakdown({ alerts }: { alerts: AlertEvent[] }) {
  const counts = EVENT_META.map((m) => ({
    ...m,
    count: alerts.filter((a) => a.event_type === m.type).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
      <p className="mb-5 text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
        Event Breakdown
      </p>
      <div className="space-y-3">
        {counts.map(({ type, label, color, icon, count }) => (
          <div key={type} className="flex items-center gap-3">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md"
              style={{
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
                color,
              }}
            >
              {icon}
            </span>
            <span className="w-36 truncate text-xs font-medium text-foreground">
              {label}
            </span>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-full bg-muted/60 h-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(count / max) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <span className="w-8 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                {count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
