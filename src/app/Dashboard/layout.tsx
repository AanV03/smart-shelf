import { Navbar } from "@/app/_components/shared/navbar"
import { Sidebar } from "@/app/_components/shared/sidebar"
import { SidebarProvider } from "@/app/_components/shared/sidebar-context"
import { getServerAuthSession } from "@/server/auth"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerAuthSession()

  if (!session) {
    return redirect("/api/auth/signin")
  }

  const userRole = (session.user.role as "MANAGER" | "EMPLOYEE") ?? "EMPLOYEE"

  return (
    <SidebarProvider>
      <div className="flex h-screen flex-col">
        <Navbar role={userRole} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar role={userRole} />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
