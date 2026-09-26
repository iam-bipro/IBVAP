"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import IbvapLogo from "@/components/ui/IbvapLogo";
import UserMenu from "@/components/ui/UserMenu";
import ConfigDrawer from "@/components/ui/ConfigDrawer";
import { Activity, Bell, BarChart3, Camera, FileText, Home as HomeIcon, LayoutDashboard, Map, Menu, Settings, SlidersHorizontal } from "lucide-react";

export default function Header({ monitoring = false }: { monitoring?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (monitoring) {
    const navigation = [
      { label: "Live Monitoring", icon: Activity, active: true },
      { label: "Map View", icon: Map },
      { label: "Alerts", icon: Bell, badge: "12" },
      { label: "Events Log", icon: SlidersHorizontal },
      { label: "Cameras", icon: Camera },
      { label: "Analytics", icon: BarChart3 },
      { label: "Reports", icon: FileText },
    ];

    return (
      <>
        {!isSidebarOpen ? (
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={false}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed left-4 top-4 z-[60] rounded-lg border border-border bg-card p-2 text-muted-foreground shadow-lg transition hover:border-primary hover:text-primary"
          >
            <Menu className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Dismiss navigation drawer"
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        />
        <aside
          aria-label="Monitoring navigation"
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-[#070707] shadow-2xl transition-transform duration-300 ease-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <Link href="/" className="border-b border-border px-5 py-6">
            <p className="text-3xl font-black tracking-tight text-foreground">
              bali<span className="text-primary">tower</span>
            </p>
            <p className="mt-4 text-sm font-semibold text-foreground">Bali Tower Pemprov DKI</p>
            <p className="mt-1 text-xs text-muted-foreground">Dashboard Analitik Provinsi DKI Jakarta</p>
          </Link>
          <nav className="flex-1 space-y-2 px-4 py-6">
            <Link
              href="/"
              onClick={() => setIsSidebarOpen(false)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <HomeIcon className="h-4 w-4" />
              <span>Home</span>
            </Link>
            {navigation.map(({ label, icon: Icon, active, badge }) => (
              <button type="button" key={label} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {badge ? <span className="ml-auto rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">{badge}</span> : null}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                setIsConfigOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>
          <div className="m-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-positive" /> System Operational</div>
            <p className="mt-2 text-xs text-muted-foreground">All systems running smoothly</p>
          </div>
          <p className="px-5 pb-5 text-xs text-muted-foreground">© 2025 Bali Tower Pemprov DKI</p>
        </aside>
        <header className="sticky top-0 z-30 border-b border-border bg-background/95">
          <div className="flex items-center justify-between px-5 py-4 pl-16 lg:px-8 lg:pl-16">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold uppercase tracking-wide">Live Monitoring</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-positive" /> System Operational</span>
            </div>
            <div className="flex min-w-0 items-center gap-3 text-sm text-muted-foreground sm:gap-5">
              <RealHeaderTime />
              <UserMenu />
            </div>
          </div>
        </header>
        <ConfigDrawer open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 transition hover:opacity-90">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 shadow-sm">
              <IbvapLogo className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">
                  IBVAP
                </span>
                <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[9px] font-semibold text-primary">
                  v1.0
                </span>
              </div>
              <h1 className="text-sm font-semibold text-foreground">Surveillance Studio</h1>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                isDashboard
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </Link>

            {!isPublicHome && (
              <button
                type="button"
                aria-label="Open configuration panel"
                aria-controls="configuration-drawer"
                aria-expanded={isConfigOpen}
                onClick={() => setIsConfigOpen(true)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isConfigOpen
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border/60 bg-background/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Config</span>
              </button>
            )}

            {isPublicHome ? (
              <button
                type="button"
                onClick={() => router.push("/auth")}
                className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
              >
                Operator Sign In
              </button>
            ) : (
              <UserMenu />
            )}
          </div>
        </div>
      </header>
      {!isPublicHome ? (
        <ConfigDrawer open={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      ) : null}
    </>
  );
}

function RealHeaderTime() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <time
      dateTime={time.toISOString()}
      className="whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-muted-foreground sm:text-xs"
    >
      <span className="hidden sm:inline">{time.toLocaleDateString()} </span>
      {time.toLocaleTimeString()}
    </time>
  );
}
