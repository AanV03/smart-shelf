"use client"

import { useEffect, useState } from "react"
import { Package, User, Clock, LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { DarkModeSwitch } from "./dark-mode-switch"
import { useSidebar } from "./sidebar-context"
import Link from "next/link"

interface NavbarProps {
  role?: "MANAGER" | "EMPLOYEE"
}

export function Navbar({ role = "EMPLOYEE" }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { toggle } = useSidebar()

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : ""

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--"

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full border-b border-border/30 bg-linear-to-r from-card via-card to-card/95 backdrop-blur-xl shadow-sm"
    >
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Logo & Toggle */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={toggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary/70 border border-border/30 text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Toggle sidebar"
            title="Toggle sidebar"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>

          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 shadow-md">
              <Package className="size-6 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                Smart-Shelf
              </h1>
              <p className="sr-only">Inventory Management System</p>
            </div>
          </div>
        </div>

        {/* Right side: Role + Clock */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            <div className="px-3 py-1 rounded-lg bg-secondary/50 border border-border/30">
              <span className="text-xs font-semibold text-secondary-foreground">
                {role === "MANAGER" ? "Store Manager" : "Warehouse Employee"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/50 px-3 py-1.5">
            <Clock className="size-4 text-primary" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <time
                dateTime={currentTime?.toISOString()}
                className="font-mono text-xs font-semibold text-foreground"
                aria-label={currentTime ? `Current time: ${formattedTime}` : "Loading time"}
              >
                {formattedTime}
              </time>
              <span className="text-[10px] text-muted-foreground">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Dark Mode Switch */}
          <DarkModeSwitch />

          {/* Profile && Sign Out */}
          <Link
            href="/dashboard/profile"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Go to profile"
            title="Go to profile"
          >
            <User className="size-4" aria-hidden="true" />
          </Link>

          {/* Sign Out Button */}
          <button
            onClick={() => void signOut()}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
