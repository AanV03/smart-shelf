"use client";

import { useEffect, useState } from "react";
import { Package, User, Clock, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { DarkModeSwitch } from "./dark-mode-switch";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";

interface NavbarProps {
  role?: "MANAGER" | "EMPLOYEE";
}

export function Navbar({ role = "EMPLOYEE" }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";

  return (
    <header
      role="banner"
      className="border-border flex h-16 w-full shrink-0 items-center justify-between border-b px-6"
      style={{ backgroundImage: "var(--gradient-navbar-bg)" }}
    >
      {/* Left: Sidebar Toggle & Logo */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="bg-primary flex size-8 items-center justify-center rounded-md">
            <Package
              className="text-primary-foreground size-5"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-foreground hidden text-sm font-bold tracking-tight sm:block">
            Smart-Shelf
          </h1>
        </div>
      </div>

      {/* Right side: Role + Clock + Actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="text-muted-foreground hidden items-center gap-2 text-xs font-medium sm:flex">
          <User className="size-4" aria-hidden="true" />
          <span>
            {role === "MANAGER" ? "Store Manager" : "Warehouse Employee"}
          </span>
        </div>

        {/* Clock */}
        <div className="text-muted-foreground hidden items-center gap-1 font-mono text-xs md:flex">
          <Clock className="size-4" aria-hidden="true" />
          <time
            dateTime={currentTime?.toISOString()}
            aria-label={
              currentTime ? `Current time: ${formattedTime}` : "Loading time"
            }
          >
            {formattedTime}
          </time>
        </div>

        {/* Dark Mode Switch */}
        <DarkModeSwitch />

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Profile Button */}
        <Link
          href="/dashboard/profile"
          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2"
          aria-label="Go to profile"
        >
          <User className="size-4" aria-hidden="true" />
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={() => void signOut()}
          className="bg-destructive/10 hover:bg-destructive/20 text-destructive focus-visible:ring-destructive flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2"
          aria-label="Sign out"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
