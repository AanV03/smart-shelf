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

  if (!session) {
    return redirect("/api/auth/signin")
  }

  const userRole = (session.user.role as "MANAGER" | "EMPLOYEE") ?? "EMPLOYEE"

  return <DashboardStructure role={userRole}>{children}</DashboardStructure>
}
