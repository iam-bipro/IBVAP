"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import IbvapLogo from "@/components/ui/IbvapLogo";
import { ShieldCheck, ArrowRight, Video, Radio } from "lucide-react";

export default function Onboard() {
  const supabase = createClient();
  const router = useRouter();
  const [station, setStation] = useState("BOP-01 (North Sector)");
  const [role, setRole] = useState("Chief Surveillance Officer");
  const [isLoading, setIsLoading] = useState(false);

  const getOnboard = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.updateUser({
        data: {
          onboard: true,
          station,
          role,
        },
      });
    } catch (err) {
      console.error(err);
    }
    // Set demo cookie as well for resiliency
    if (typeof document !== "undefined") {
      document.cookie = "ibvap-demo-user=true; path=/; max-age=604800";
    }
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.22),transparent_35%),linear-gradient(135deg,var(--background),color-mix(in_srgb,var(--background)_85%,var(--primary)_15%))] p-4 text-foreground">
      <div className="w-full max-w-lg rounded-4xl border border-border/80 bg-card/85 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <div className="flex items-center gap-3 text-primary mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <IbvapLogo className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
              Operator Stationing
            </p>
            <h1 className="text-2xl font-bold">Assign Surveillance Sector</h1>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed mb-6">
          Select your assigned Border Out Post station and operator designation to
          initialize real-time telemetry stream links.
        </p>

        <div className="space-y-4 mb-8">
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Video className="h-3.5 w-3.5 text-primary" />
              <span>Assigned Station / Outpost</span>
            </label>
            <select
              value={station}
              onChange={(e) => setStation(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground outline-none"
            >
              <option value="BOP-01 (North Sector)">BOP-01 (North Sector Perimeter)</option>
              <option value="BOP-02 (Eastern Checkpoint)">BOP-02 (Eastern Highway Checkpoint)</option>
              <option value="BOP-03 (Riverine Surveillance)">BOP-03 (Riverine Surveillance Grid)</option>
            </select>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
            <label className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Radio className="h-3.5 w-3.5 text-primary" />
              <span>Operator Role / Call-Sign</span>
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-foreground outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={getOnboard}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Authorize & Enter Surveillance Studio</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
