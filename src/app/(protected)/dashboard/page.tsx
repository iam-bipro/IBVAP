"use client";

import Header from "@/components/ui/Header";
import ThemeToggle from "@/components/theme/theme-toggle";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(46,107,88,0.18),transparent_28%),linear-gradient(135deg,var(--background),color-mix(in srgb,var(--background) 82%, var(--primary) 18%))] text-foreground">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-[0_20px_60px_rgba(20,36,32,0.12)] backdrop-blur-xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted-foreground">
              Overview
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">Dashboard</h2>
          </div>
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
