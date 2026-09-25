"use client";

import Link from "next/link";
import Header from "@/components/ui/Header";
import IbvapLogo from "@/components/ui/IbvapLogo";
import {
  ShieldAlert,
  Eye,
  Car,
  Radar,
  SlidersHorizontal,
  ArrowRight,
  Cpu,
  Zap,
  Lock,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const enterDashboard = () => {
    if (typeof document !== "undefined") {
      document.cookie = "ibvap-demo-user=true; path=/; max-age=604800";
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.22),transparent_35%),linear-gradient(135deg,var(--background),color-mix(in_srgb,var(--background)_85%,var(--primary)_15%))] text-foreground">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <section className="relative flex flex-col items-center text-center pt-8 pb-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Smart India Hackathon · Ministry of Home Affairs</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl text-foreground">
            Intelligent Border <br />
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Video Analytics Platform
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Turn standard border CCTV cameras into intelligent sentries. Real-time
            virtual tripwire breach detection, loitering alerts, wrong-way vehicle
            tracking, and automated license plate recognition — <strong>without buying a single piece of new hardware</strong>.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard?demo=true"
              onClick={enterDashboard}
              className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90"
            >
              <span>Launch Surveillance Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard?demo=true"
              onClick={enterDashboard}
              className="flex items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-6 py-3.5 text-sm font-semibold text-foreground backdrop-blur shadow-sm transition hover:border-primary/50"
            >
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <span>Geometry & Fence Config</span>
            </Link>

            <Link
              href="/auth"
              className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-5 py-3.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <Lock className="h-4 w-4" />
              <span>Operator Login</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 w-full max-w-4xl">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-primary tabular-nums">30+ FPS</p>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time Inference</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-foreground tabular-nums">&lt; 35ms</p>
              <p className="text-xs text-muted-foreground mt-0.5">WebSocket Alert Latency</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-foreground tabular-nums">5 Core</p>
              <p className="text-xs text-muted-foreground mt-0.5">Security AI Models</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-[var(--positive)] tabular-nums">$0</p>
              <p className="text-xs text-muted-foreground mt-0.5">New Hardware Required</p>
            </div>
          </div>
        </section>

        {/* ── Core Capabilities ────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
              AI Surveillance Suite
            </p>
            <h2 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">
              Advanced CCTV Analytics Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-4">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Virtual Fence Breach
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Configurable geometric tripwires. Calculates cross-product intersection
                vectors on every tracked centroid, instantly flagging boundary violations.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/15 text-[var(--warning)] mb-4">
                <Radar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Restricted Zone Loitering
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Define arbitrary polygon zones with point-in-polygon raycasting. Tracks
                dwell-time frames and triggers warnings for lingering subjects.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Wrong-Way Vehicle Tracking
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                ByteTrack vector trajectory analysis calculates velocity heading angles,
                immediately alerting when vehicles travel against designated checkpoint flow.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--positive)]/15 text-[var(--positive)] mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Automated Number Plate Recognition (ANPR)
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                YOLOv8 license plate localization combined with EasyOCR text extraction,
                recording vehicle plates and matching against alert registries.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Near-Zero Light Vision
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Contrast Limited Adaptive Histogram Equalization (CLAHE) and gamma correction
                pipeline recovers details from pitch-black nighttime feeds.
              </p>
            </div>

            <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur transition hover:border-primary/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Edge-Ready Architecture
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                FastAPI Python backend with MJPEG streaming over HTTP, sub-50ms WebSocket
                alert broadcasts, and Next.js React 19 frontend.
              </p>
            </div>
          </div>
        </section>

        {/* ── Call to action ───────────────────────────────────────────── */}
        <section className="rounded-4xl border border-primary/30 bg-card/80 p-8 sm:p-12 text-center backdrop-blur-xl shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 mb-4">
            <IbvapLogo className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            Ready to inspect the live surveillance studio?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Access the BOP-01 camera feed, live alert dispatch feed, and configure virtual
            boundaries in real-time.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/dashboard?demo=true"
              onClick={enterDashboard}
              className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
            >
              <span>Open Surveillance Studio</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
