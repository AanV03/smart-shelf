"use client"

import { useEffect, useState } from "react"
import { Package, User, Clock, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/60 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/15">
            <Package className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Smart-Shelf
            </h1>
            <p className="sr-only">Inventory Management System</p>
          </div>
        </div>

        {/* Right side: Role + Clock */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <User className="size-4 text-muted-foreground" aria-hidden="true" />
            <Badge
              variant="secondary"
              className="border border-border/60 bg-secondary/80 text-secondary-foreground"
            >
              {roleLabel}
            </Badge>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-secondary/50 px-3 py-1.5">
            <Clock className="size-3.5 text-primary" aria-hidden="true" />
            <div className="flex flex-col items-end">
              <time
                dateTime={currentTime?.toISOString()}
                className="font-mono text-xs font-medium text-foreground"
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
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-muted-foreground hover:bg-secondary/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
