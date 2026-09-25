"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import IbvapLogo from "@/components/ui/IbvapLogo";
import UserMenu from "@/components/ui/UserMenu";
import ConfigDrawer from "@/components/ui/ConfigDrawer";
import { LayoutDashboard, Settings } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicHome = pathname === "/";
  const isDashboard = pathname === "/dashboard";
  const [isConfigOpen, setIsConfigOpen] = useState(false);

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
