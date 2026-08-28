"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import UserMenu from "@/components/ui/UserMenu";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicHome = pathname === "/";

  return (
    <header className="relative z-40 border-b border-border/70 bg-card/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-primary/20 bg-primary/10">
            <Image
              src="/logo.png"
              alt="SentinelX logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              SentinelX
            </p>
            <h1 className="text-sm font-semibold text-foreground">Budget Studio</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPublicHome ? (
            <button
              type="button"
              onClick={() => router.push("/auth")}
              className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20"
            >
              Login
            </button>
          ) : <UserMenu />}
        </div>
      </div>
    </header>
  );
}
