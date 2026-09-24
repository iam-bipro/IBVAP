"use client";

import type { AlertEvent } from "@/lib/ibvap/client";

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL:
    "bg-[color-mix(in_srgb,var(--negative)_15%,transparent)] text-[var(--negative)] border-[color-mix(in_srgb,var(--negative)_30%,transparent)]",
  WARNING:
    "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_30%,transparent)]",
  INFO: "bg-[color-mix(in_srgb,var(--positive)_15%,transparent)] text-[var(--positive)] border-[color-mix(in_srgb,var(--positive)_30%,transparent)]",
};

const EVENT_LABELS: Record<string, string> = {
  PERIMETER_BREACH: "Perimeter Breach",
  LOITERING_ALERT: "Loitering",
  SUDDEN_MOVEMENT: "Sudden Movement",
  WRONG_WAY_VEHICLE: "Wrong Way",
  ANPR_DETECT: "ANPR Detect",
};

interface AlertBadgeProps {
  severity: AlertEvent["severity"];
  eventType: AlertEvent["event_type"];
}

export default function AlertBadge({ severity, eventType }: AlertBadgeProps) {
  const style =
    SEVERITY_STYLES[severity] ??
    "bg-muted text-muted-foreground border-border/70";
  const label = EVENT_LABELS[eventType] ?? eventType;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
