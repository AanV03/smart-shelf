"use client"

import { useEffect, useState } from "react"
import { Package, User, Clock, LogOut } from "lucide-react"

interface NavbarProps {
  role?: "MANAGER" | "EMPLOYEE"
}

export function Navbar({ role = "EMPLOYEE" }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

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

  const roleLabel = role === "MANAGER" ? "Store Manager" : "Warehouse Employee"

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full border-b border-border/30 bg-linear-to-r from-card via-card to-card/95 backdrop-blur-xl shadow-sm"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
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

        {/* Right side: Role + Clock */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 sm:flex">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            <div className="px-3 py-1 rounded-lg bg-secondary/50 border border-border/30">
              <span className="text-xs font-semibold text-secondary-foreground">
                {roleLabel}
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

          {/* Sign Out Button */}
          <button
            onClick={() => {}}
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
