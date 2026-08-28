"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function UserMenu() {
  const router = useRouter();
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  const [userName, setUserName] = useState("SentinelX");
  const [email, setEmail] = useState("test@sentinelx.com");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      const resolvedName =
        user?.user_metadata?.full_name || user?.email?.split("@")[0] || "SentinelX";

      setUserName(resolvedName);
      setEmail(user?.email || "test@sentinelx.com");
      setIsAuthenticated(Boolean(user));
      setIsLoading(false);
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
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/auth");
    router.refresh();
  }

  const handleSettings = () => {
    setIsOpen(false);
    router.push("/settings");
  };

  if (isLoading || !isAuthenticated) return null;

  const initial = (userName || "SentinelX").trim().charAt(0).toUpperCase() || "R";

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-2 py-2 shadow-sm transition hover:border-primary/40 hover:bg-background"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {initial}
        </div>
        <ChevronDown className="mr-1 h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border/70 bg-background/90 p-2 shadow-[0_20px_55px_rgba(20,36,32,0.22)] backdrop-blur-xl">
          <div className="mb-2 rounded-xl bg-card/70 px-3 py-2">
            <p className="text-sm font-semibold text-foreground">{userName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>

          <button
            type="button"
            onClick={handleSettings}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-card/80"
          >
            <Settings className="h-4 w-4 text-primary" />
            Settings
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-card/80"
          >
            <UserRound className="h-4 w-4 text-primary" />
            Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-foreground transition hover:bg-card/80"
          >
            <LogOut className="h-4 w-4 text-negative" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
