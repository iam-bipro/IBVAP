"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

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
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.22),transparent_35%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background) 85%, var(--primary) 15%))] px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-8 lg:flex-row">
        <div className="w-full max-w-xl rounded-4xl border border-border/80 bg-card/85 p-8 shadow-[0_30px_80px_rgba(20,36,32,0.18)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex items-center gap-3 text-primary">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-primary/20 bg-primary/10">
              <Image
                src="/logo.png"
                alt="SentinelX logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                SentinelX
              </p>
              <h1 className="text-xl font-semibold">Welcome back</h1>
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
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === "login"
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
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeTab === "signup"
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
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ava Patel"
                  autoComplete="name"
                  required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
            ) : null}

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
              <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={activeTab === "login" ? "current-password" : "new-password"}
                required
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            {activeTab === "signup" ? (
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-inner">
                <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
            ) : null}

            {errorMessage ? (
              <p role="alert" className="rounded-xl border border-negative/20 bg-negative/10 px-4 py-3 text-sm text-negative">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl border border-positive/20 bg-positive/10 px-4 py-3 text-sm text-positive">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                activeTab === "login" ? "Signing you in..." : "Creating account..."
              ) : (
                <>
                  {activeTab === "login" ? "Log in" : "Create account"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="w-full max-w-md rounded-4xl border border-border/80 bg-background/70 p-8 shadow-[0_20px_60px_rgba(20,36,32,0.14)] backdrop-blur-xl">
          <div className="mb-4 inline-flex rounded-full bg-primary/10 p-2 text-primary">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            {activeTab === "login" ? "Secure, simple access" : "Build your money view"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {activeTab === "login"
              ? "Jump back into your dashboard with a polished, protected sign-in experience."
              : "Create your account to start organizing income, expenses, and goals in one place."}
          </p>
          <ul className="mt-6 space-y-3 text-sm text-foreground">
            <li className="flex items-center gap-3 rounded-xl bg-card/80 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Elegant light and dark themes
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-card/80 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-positive" />
              Fast and secure authentication
            </li>
            <li className="flex items-center gap-3 rounded-xl bg-card/80 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-warning" />
              A calm, premium looking entry point
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
