"use client";

import Header from "@/components/ui/Header";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.18),transparent_28%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background) 82%, var(--primary) 18%))] text-foreground">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">Manage your account</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            This is a basic settings view for your workspace. You can expand it later with profile details, preferences, and security controls.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <h2 className="text-sm font-semibold text-foreground">Profile</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Update your name, email, and account details.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Adjust the appearance and experience of SentinelX.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
