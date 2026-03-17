import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardStructure } from "@/app/dashboard/_components/DashboardStructure";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();

  console.log("[DASHBOARD_LAYOUT] Session:", {
    exists: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    stores: session?.user?.stores,
  });

  // ✅ VALIDATION 1: User must be authenticated
  if (!session) {
    console.log("[DASHBOARD_LAYOUT] No session found, redirecting to login");
    redirect("/auth/login");
  }

  // ✅ VALIDATION 2: User must be associated with at least one store (MULTI-TENANT REQUIREMENT)
  // If stores array is empty or contains only PENDING/INACTIVE stores, redirect to onboarding
  const activeStores =
    session.user.stores?.filter(
      (s) => s.status === "ACTIVE" && s.role !== "PENDING",
    ) ?? [];

  if (activeStores.length === 0) {
    console.log(
      "[DASHBOARD_LAYOUT] User has no active stores, redirecting to onboarding",
      {
        userId: session.user.id,
        totalStores: session.user.stores?.length ?? 0,
      },
    );
    redirect("/onboarding");
  }

  // ✅ SAFE: Only assign role from active store (NO DEFAULT!)
  const userRole = activeStores[0]?.role as
    | "ADMIN"
    | "MANAGER"
    | "EMPLOYEE"
    | undefined;

  if (!userRole) {
    console.error(
      "[DASHBOARD_LAYOUT] CRITICAL: Active store exists but no role found",
    );
    redirect("/onboarding");
  }

  return <DashboardStructure role={userRole}>{children}</DashboardStructure>;
}
