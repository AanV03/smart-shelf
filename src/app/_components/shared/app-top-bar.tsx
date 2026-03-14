"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import {
  Bell,
  Clock,
  LogOut,
  User,
  ChevronsUpDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DarkModeSwitch } from "./dark-mode-switch"

interface AppTopBarProps {
  role?: "ADMIN" | "MANAGER" | "EMPLOYEE"
}

export function AppTopBar({ role = "EMPLOYEE" }: AppTopBarProps) {
  const { data: session } = useSession()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : "--:--:--"

  const userInitials = session?.user?.email
    ? session.user.email.substring(0, 2).toUpperCase()
    : "US"

  return (
    <header className="h-16 sticky top-0 z-40 flex shrink-0 items-center justify-between border-b border-border bg-linear-to-r dark:from-[#0a0e27] dark:via-[#1a4d3e] dark:to-[#0a0e27] from-[#f5f5f7] via-[#c8e6e0] to-[#f5f5f7] backdrop-blur-sm px-6">
      {/* Left: Sidebar Trigger + Logo/Title */}
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-foreground" />
      </div>

      {/* Center: spacer */}
      <div className="flex-1" />

      {/* Right: Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications Bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Button>

        {/* Clock - Hidden on mobile */}
        <div className="hidden items-center gap-2 text-xs font-mono text-muted-foreground sm:flex">
          <Clock className="h-4 w-4" aria-hidden="true" />
          <time dateTime={currentTime?.toISOString()}>
            {formattedTime}
          </time>
        </div>

        {/* Dark Mode Toggle */}
        <DarkModeSwitch />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative gap-2 px-2 sm:pr-3 h-9 w-auto sm:w-auto justify-between"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                {userInitials}
              </div>
              <div className="hidden flex-col text-left sm:flex">
                <div className="text-xs font-medium leading-tight truncate max-w-37.5">
                  {session?.user?.email ?? "User"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {role === "ADMIN" ? "Admin" : role === "MANAGER" ? "Manager" : "Employee"}
                </div>
              </div>
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile" className="cursor-pointer flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Perfil</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Salir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

