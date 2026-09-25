"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/ui/Header";
import ThemeToggle from "@/components/theme/theme-toggle";
import CameraWall from "@/components/ibvap/CameraWall";
import AlertsTable from "@/components/ibvap/AlertsTable";
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
    loadHistory();
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.18),transparent_28%),linear-gradient(135deg,var(--background),color-mix(in_srgb,var(--background)_82%,var(--primary)_18%))] text-foreground">
      <Header />

      <main className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                IBVAP
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">
                Surveillance Dashboard
              </h2>
            </div>
            <EngineStatus />
          </div>
          <ThemeToggle />
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <CameraWall />

          <div className="min-h-[34rem]">
            <AlertsTable alerts={alerts} />
          </div>
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
