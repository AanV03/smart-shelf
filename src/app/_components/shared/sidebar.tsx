"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  BarChart3,
  Settings,
  Home,
  Grid3x3,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "./sidebar-context"

interface SidebarProps {
  role?: "MANAGER" | "EMPLOYEE"
}

export function Sidebar({ role = "EMPLOYEE" }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

  // Nav items based on role
  const navItems =
    role === "MANAGER"
      ? [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/dashboard/inventory", label: "Inventory", icon: Package },
          { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
          { href: "/dashboard/users", label: "Users", icon: Users },
          { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: Home },
          { href: "/dashboard/batch-entry", label: "Batch Entry", icon: Grid3x3 },
          { href: "/dashboard/inventory", label: "Inventory", icon: Package },
        ]

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border/30 bg-card sticky top-0 left-0 transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 p-4">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70">
              <Package className="size-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-foreground whitespace-nowrap">Smart-Shelf</h2>
          </div>
        )}
        {!isOpen && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-primary/70 mx-auto">
            <Package className="size-5 text-primary-foreground" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap overflow-hidden",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                  title={label}
                >
                  <Icon className="size-4 flex-shrink-0" aria-hidden="true" />
                  {isOpen && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {isOpen && (
        <div className="border-t border-border/30 p-4">
          <p className="text-xs text-muted-foreground">
            {role === "MANAGER" ? "Store Manager" : "Warehouse Employee"}
          </p>
        </div>
      )}
    </aside>
  )
}

