"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bell,
  BrainCircuit,
  Building2,
  Car,
  Camera,
  CircleAlert,
  Users,
} from "lucide-react";

const steps = [
  { number: "01", title: "Capture", description: "Live feeds from city cameras", icon: Camera },
  { number: "02", title: "Analyze", description: "AI models detect crowds, vehicles, smoke and unusual activity", icon: BrainCircuit },
  { number: "03", title: "Alert", description: "Instant notifications via WebSocket", icon: Bell },
  { number: "04", title: "Take Action", description: "Enable faster response and better decisions", icon: Users },
];

const useCases = [
  { title: "Crowd Monitoring", description: "Detect overcrowding in public areas", icon: Users },
  { title: "Traffic Management", description: "Monitor congestion and vehicle flow", icon: Car },
  { title: "Incident Detection", description: "Identify smoke, accidents and unusual activity", icon: CircleAlert },
  { title: "Smart City Operations", description: "Support safer and more efficient urban management", icon: Building2 },
];

export default function Home() {
  const enterDashboard = () => {
    document.cookie = "ibvap-demo-user=true; path=/; max-age=604800";
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="text-3xl font-black tracking-tight">bali<span className="text-primary">tower</span></Link>
          <nav className="hidden items-center gap-10 text-sm md:flex">
            {["Home", "Features", "Use Cases", "Technology", "About"].map((item, index) => (
              <a key={item} href={index === 0 ? "#" : `#${item.toLowerCase().replace(" ", "-")}`} className={`transition hover:text-primary ${index === 0 ? "border-b-2 border-primary pb-4 text-white" : "text-white/75"}`}>{item}</a>
            ))}
          </nav>
          <Link href="/dashboard?demo=true" onClick={enterDashboard} className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/85">Dashboard <ArrowRight className="ml-2 inline h-4 w-4" /></Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 py-16 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-20">
            <div className="relative z-10">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/80"><span className="h-0.5 w-9 bg-primary" /> Real-time AI surveillance</p>
              <h1 className="mt-6 text-5xl font-black leading-[.98] tracking-tight sm:text-7xl">Smarter Cities<br /><span className="text-primary">Safer</span> Communities</h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/70 sm:text-lg">AI-powered video analytics for real-time crowd, traffic, and incident monitoring across DKI Jakarta. Turning city cameras into actionable intelligence.</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#features" className="rounded-lg bg-primary px-7 py-4 text-sm font-bold transition hover:bg-primary/85">Learn More <ArrowRight className="ml-2 inline h-4 w-4" /></a>
              </div>
            </div>
            <div className="relative min-h-[22rem] overflow-hidden rounded-xl border border-white/10 bg-black">
              <Image src="/jakarta-surveillance.png" alt="Jakarta city traffic monitored by AI surveillance cameras" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-center opacity-90" priority />
              <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-black/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
              {[["left-[12%] top-[45%]", "CROWD"], ["left-[50%] top-[48%]", "VEHICLE"], ["right-[10%] top-[42%]", "CROWD"], ["right-[33%] bottom-[13%]", "VEHICLE"]].map(([position, label]) => <div key={position} className={`absolute ${position} h-20 w-20 border-2 border-primary`}><span className="absolute -top-6 left-0 bg-primary px-2 py-1 text-[10px] font-bold">{label}</span></div>)}
              <div className="absolute bottom-3 left-4 flex items-center gap-2 text-xs font-semibold"><span className="h-2 w-2 rounded-full bg-primary" /> LIVE CITY FEED · JAKARTA</div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/15 px-5 py-8 sm:grid-cols-4 lg:px-8">
            {[["300+", "City Cameras (Pilot)"], ["99%", "Detection Accuracy"], ["< 2s", "Alert Latency"], ["24/7", "Monitoring"]].map(([value, label]) => <div key={label} className="px-4 text-center"><p className="text-3xl font-black sm:text-4xl">{value}</p><p className="mt-1 text-xs text-white/70 sm:text-sm">{label}</p></div>)}
          </div>
        </section>

        <PipelineSection />
        <UseCasesSection />
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="section-label flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/85"><span className="section-label-line h-0.5 w-9 bg-primary" /> {children} <span className="text-primary">→</span></p>;
}

function useVisible<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, visible] as const;
}

function PipelineSection() {
  const [ref, visible] = useVisible<HTMLElement>();
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const reducedMotionTimer = window.setTimeout(() => setActiveStep(3), 0);
      return () => window.clearTimeout(reducedMotionTimer);
    }
    let step = 0;
    const timer = window.setInterval(() => {
      step = (step + 1) % 4;
      setActiveStep(step);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [visible]);
  return (
    <section ref={ref} id="features" className={`pipeline-section mx-auto max-w-7xl px-5 py-16 lg:px-8 ${visible ? "is-visible" : ""}`}>
      <SectionLabel>How it works</SectionLabel>
      <div className="pipeline mt-8 grid gap-8 md:grid-cols-4">
        {steps.map(({ number, title, description, icon: Icon }, index) => (
          <div key={title} className={`pipeline-step relative flex gap-4 md:block ${activeStep >= index ? "is-active" : ""}`}>
            <div className="pipeline-node flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 text-primary">
              <Icon className="h-7 w-7" />
              {index === 0 ? <span className="pipeline-live">LIVE</span> : null}
              {index === 2 ? <span className="pipeline-alert">ALERT DETECTED</span> : null}
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-primary">{number}</p>
              <h3 className="mt-2 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
              {index === 3 ? <p className="pipeline-status mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{activeStep === 3 ? "Action ready" : "Processing"}</p> : null}
            </div>
            {index < 3 ? <div className={`pipeline-connector ${activeStep > index ? "is-active" : ""}`}><span /></div> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCasesSection() {
  const [ref, visible] = useVisible<HTMLElement>();
  return (
    <section ref={ref} id="use-cases" className={`use-cases-section mx-auto max-w-7xl px-5 pb-20 lg:px-8 ${visible ? "is-visible" : ""}`}>
      <SectionLabel>Use cases</SectionLabel>
      <div className="use-case-grid relative mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <span className="use-case-signal" aria-hidden="true" />
        {useCases.map(({ title, description, icon: Icon }, index) => (
          <div key={title} className={`use-case-card group relative overflow-hidden rounded-xl border border-white/15 bg-white/[.02] p-6 transition ${index === 0 ? "crowd-card" : index === 1 ? "traffic-card" : index === 2 ? "incident-card" : "city-card"}`}>
            <span className="use-case-grid-noise" aria-hidden="true" />
            <span className="use-case-scan" aria-hidden="true" />
            <span className="use-case-micro" aria-hidden="true">{index === 2 ? "DETECTED" : "AI ACTIVE"}</span>
            <Icon className="use-case-icon relative z-10 h-8 w-8 text-primary" />
            <h3 className="relative z-10 mt-5 font-bold">{title}</h3>
            <p className="use-case-description relative z-10 mt-2 text-sm leading-6 text-white/60">{description}</p>
            <ArrowRight className="use-case-arrow relative z-10 mt-5 h-4 w-4 text-white/70 transition" />
          </div>
        ))}
      </div>
    </section>
  );
}
