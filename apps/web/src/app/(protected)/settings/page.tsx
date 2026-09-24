"use client";

import Header from "@/components/ui/Header";
import GeometryConfig from "@/components/ibvap/GeometryConfig";
import ThemeToggle from "@/components/theme/theme-toggle";
import { SlidersHorizontal } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.18),transparent_28%),linear-gradient(135deg,var(--background),color-mix(in_srgb,var(--background)_82%,var(--primary)_18%))] text-foreground">
      <Header />

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
                Configuration
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-foreground">
                Geometry Settings
              </h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Description */}
        <p className="px-1 text-sm leading-6 text-muted-foreground">
          Configure the virtual fence line and restricted zone polygon for camera{" "}
          <strong className="text-foreground">BOP-01</strong>. Changes are applied
          live to the IBVAP engine without restarting the backend.
        </p>

        {/* Config form */}
        <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
          <GeometryConfig />
        </div>
      </main>
    </div>
  );
}
