"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import type { AlertEvent } from "@/lib/ibvap/client";
import AlertBadge from "@/components/ibvap/AlertBadge";

const OBJECT_ICONS: Record<string, string> = {
  car: "🚗",
  bus: "🚌",
  truck: "🚛",
  motorcycle: "🏍️",
  bicycle: "🚲",
  person: "🚶",
};

interface AlertsTableProps {
  alerts: AlertEvent[];
}

export default function AlertsTable({ alerts }: AlertsTableProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new alerts arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [alerts.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/80 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Real-time Alerts
          </span>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {alerts.length}
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No alerts yet</p>
            <p className="text-xs text-muted-foreground/60">
              Alerts will appear here in real-time
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <tr className="border-b border-border/70 text-left text-muted-foreground">
                <th className="px-4 py-2 font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Object</th>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {[...alerts].reverse().map((alert, idx) => (
                <tr
                  key={`${alert.track_id}-${alert.frame}-${idx}`}
                  className="border-b border-border/40 transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2">
                    <AlertBadge
                      severity={alert.severity}
                      eventType={alert.event_type}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <span className="flex items-center gap-1">
                      <span>
                        {OBJECT_ICONS[alert.object_type.toLowerCase()] ?? "📦"}
                      </span>
                      <span className="capitalize text-foreground">
                        {alert.object_type}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">
                    #{alert.track_id}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {alert.details ? (
                      <span className="font-mono">
                        {alert.event_type === "ANPR_DETECT"
                          ? `🔎 ${(alert.details as { plate?: string }).plate ?? ""}`
                          : JSON.stringify(alert.details)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
