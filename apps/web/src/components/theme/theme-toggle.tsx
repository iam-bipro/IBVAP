"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!mounted) return null;

  const cycleTheme = () => {
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("system");
        break;
      default:
        setTheme("light");
    }
  };

  const icon = theme === "light"
    ? <Sun className="h-5 w-5" />
    : theme === "dark"
      ? <Moon className="h-5 w-5" />
      : <Monitor className="h-5 w-5" />;

  return (
    <button
      onClick={cycleTheme}
      className="rounded-md border p-2 transition-colors hover:bg-accent"
      aria-label={`Current theme: ${theme}`}
      title={`Theme: ${theme}`}
    >
      {icon}
    </button>
  );
}