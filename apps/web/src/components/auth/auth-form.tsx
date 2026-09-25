"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Sparkles, Shield, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import IbvapLogo from "@/components/ui/IbvapLogo";

interface AuthFormProps {
  initialTab?: "login" | "signup";
}

export default function AuthForm({ initialTab = "login" }: AuthFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleDemoLogin() {
    document.cookie = "ibvap-demo-user=true; path=/; max-age=604800";
    router.replace("/dashboard");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (!supabase) {
        setErrorMessage("Supabase is not configured. Use Demo Login or configure the environment variables.");
        setIsLoading(false);
        return;
      }

      if (activeTab === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          setIsLoading(false);
          return;
        }

        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
        }

        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            onboard: false,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (data.session) {
        router.replace("/onboard");
        router.refresh();
        return;
      }

      setSuccessMessage("Account created. Please check your inbox to confirm your email.");
      setIsLoading(false);
    } catch {
      setErrorMessage(
        "Authentication service unreachable. Use 'Demo Operator Mode' below to explore IBVAP immediately."
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.22),transparent_35%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background) 85%, var(--primary) 15%))] px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="w-full max-w-xl rounded-4xl border border-border/80 bg-card/85 p-8 shadow-[0_30px_80px_rgba(20,36,32,0.18)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex items-center gap-3 text-primary">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
              <IbvapLogo className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                IBVAP
              </p>
              <h1 className="text-xl font-semibold">
                {activeTab === "login" ? "Operator Sign In" : "Register Operator"}
              </h1>
            </div>
          </div>

          {/* Quick Demo Access banner */}
          <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Instant Demo Mode
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Access live CCTV feeds, alerts & geometry without credentials.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow transition hover:opacity-95"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Enter Demo
              </button>
            </div>
          </div>

          <div className="mb-7 inline-flex rounded-full border border-border bg-background/80 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "login"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === "signup"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "signup" ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Operator Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Officer J. Miller"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@ibvap.local"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Security Passcode / Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              />
            </div>

            {activeTab === "signup" ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
                />
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-positive/30 bg-positive/10 p-3.5 text-xs text-positive">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
            >
              <span>{activeTab === "login" ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Feature showcase sidebar */}
        <div className="max-w-md space-y-6 text-foreground">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Border Security AI
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Intelligent Border Video Analytics Platform
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            IBVAP augments existing standard CCTV hardware with edge-deployed
            YOLOv8 & ByteTrack analytics — alerting on virtual perimeter breach,
            wrong-way vehicle travel, restricted zone loitering, and license plates.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 p-3.5 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <LockKeyhole className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Zero New Hardware</p>
                <p className="text-[11px] text-muted-foreground">
                  Works directly with existing IP/RTSP streams
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
