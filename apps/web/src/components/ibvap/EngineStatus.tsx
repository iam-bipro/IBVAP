"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { fetchHealth } from "@/lib/ibvap/client";

type Status = "checking" | "operational" | "offline";

export default function EngineStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [engineReady, setEngineReady] = useState(false);

  const check = async () => {
    try {
      const data = await fetchHealth();
      setStatus("operational");
      setEngineReady(data.engine_ready);
    } catch {
      setStatus("offline");
      setEngineReady(false);
    }
  };

  useEffect(() => {
    check();
    const id = setInterval(check, 10_000);
    return () => clearInterval(id);
  }, []);

  const config = {
    checking: {
      icon: <Activity className="h-3.5 w-3.5 animate-pulse" />,
      label: "Checking…",
      className:
        "bg-muted text-muted-foreground border-border/70",
    },
    operational: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: engineReady ? "Engine Ready" : "Server Up",
      className:
        "bg-[color-mix(in_srgb,var(--positive)_15%,transparent)] text-[var(--positive)] border-[color-mix(in_srgb,var(--positive)_35%,transparent)]",
    },
    offline: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: "Backend Offline",
      className:
        "bg-[color-mix(in_srgb,var(--negative)_15%,transparent)] text-[var(--negative)] border-[color-mix(in_srgb,var(--negative)_35%,transparent)]",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
