"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("SentinelX");
  const [email, setEmail] = useState("bop01@sentinelx.local");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (user) {
          const resolvedName =
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "SentinelX";
          setUserName(resolvedName);
          setEmail(user?.email || "officer@sentinelx.local");
          setIsAuthenticated(true);
          setIsDemo(false);
          setIsLoading(false);
          return;
        }
      } catch {
        // Supabase unreachable
      }

      // Check for demo cookie
      const hasDemoCookie =
        typeof document !== "undefined" &&
        document.cookie.includes("sentinelx-demo-user=true");

      if (isMounted) {
        if (hasDemoCookie) {
          setUserName("Officer (Demo)");
          setEmail("bop01@sentinelx.local");
          setIsAuthenticated(true);
          setIsDemo(true);
        } else {
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    }

    loadUser();

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      isMounted = false;
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [supabase]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.cookie = "sentinelx-demo-user=; path=/; max-age=0";
    }
    setIsOpen(false);
    router.replace("/auth");
    router.refresh();
  }

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  if (isLoading || !isAuthenticated) return null;

  const initial = (userName || "O").trim().charAt(0).toUpperCase();

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-1.5 shadow-sm transition hover:border-primary/40 hover:bg-background"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initial}
        </div>
        <span className="hidden sm:inline text-xs font-medium text-foreground">
          {userName}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-[0_20px_55px_rgba(20,36,32,0.22)] backdrop-blur-xl">
          <div className="mb-2 rounded-xl bg-background/70 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">{userName}</p>
              {isDemo && (
                <span className="rounded bg-primary/20 px-1 py-0.2 text-[9px] font-bold text-primary">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>

          <button
            type="button"
            onClick={handleSettings}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background"
          >
            <Settings className="h-4 w-4 text-primary" />
            Geometry Config
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-destructive transition hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4 text-destructive" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
