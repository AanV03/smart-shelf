import { getServerAuthSession } from "@/server/auth"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { DashboardStructure } from "@/app/dashboard/_components/DashboardStructure"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerAuthSession()

  console.log("[DASHBOARD_LAYOUT] Session:", {
    exists: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    storeId: session?.user?.storeId,
    role: session?.user?.role,
  });

  if (!session) {
    console.log("[DASHBOARD_LAYOUT] No session found, redirecting to login");
    redirect("/auth/login")
  }

  const userRole = (session.user.role as "MANAGER" | "EMPLOYEE") ?? "EMPLOYEE"

  return <DashboardStructure role={userRole}>{children}</DashboardStructure>
}
