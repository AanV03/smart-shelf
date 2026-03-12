"use client"

import { useEffect, useState } from "react"
import { Package, User, Clock, LogOut, Menu } from "lucide-react"
import { signOut } from "next-auth/react"
import { DarkModeSwitch } from "./dark-mode-switch"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"

interface NavbarProps {
  role?: "MANAGER" | "EMPLOYEE"
}

export function Navbar({ role = "EMPLOYEE" }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const { toggleSidebar } = useSidebar()

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
      className="flex h-16 w-full items-center justify-between border-b border-border bg-background px-6 shrink-0"
    >
      {/* Left: Sidebar Toggle & Logo */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
        >
          <Menu className="size-4" aria-hidden="true" />
        </button>

        {/* Logo & App Name */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary">
            <Package className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-sm font-bold tracking-tight text-foreground hidden sm:block">
            Smart-Shelf
          </h1>
        </div>
      </div>

      {/* Right side: Role + Clock + Actions */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="hidden items-center gap-2 sm:flex text-xs font-medium text-muted-foreground">
          <User className="size-4" aria-hidden="true" />
          <span>{role === "MANAGER" ? "Store Manager" : "Warehouse Employee"}</span>
        </div>

        {/* Clock */}
        <div className="hidden md:flex items-center gap-1 text-xs font-mono text-muted-foreground">
          <Clock className="size-4" aria-hidden="true" />
          <time dateTime={currentTime?.toISOString()} aria-label={currentTime ? `Current time: ${formattedTime}` : "Loading time"}>
            {formattedTime}
          </time>
        </div>

        {/* Dark Mode Switch */}
        <DarkModeSwitch />

        {/* Profile Button */}
        <Link
          href="/dashboard/profile"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Go to profile"
        >
          <User className="size-4" aria-hidden="true" />
        </Link>

        {/* Sign Out Button */}
        <button
          onClick={() => void signOut()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-destructive"
          aria-label="Sign out"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
