import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerAuthSession();

  console.log("[ONBOARDING_LAYOUT] Session:", {
    exists: !!session,
    userId: session?.user?.id,
    email: session?.user?.email,
    stores: session?.user?.stores?.length ?? 0,
  });

  // ✅ VALIDATION 1: User must be authenticated
  if (!session) {
    console.log("[ONBOARDING_LAYOUT] No session found, redirecting to login");
    redirect("/auth/login");
  }

  // ✅ VALIDATION 2: If user already has active stores, redirect to dashboard
  const activeStores =
    session.user.stores?.filter(
      (s) => s.status === "ACTIVE" && s.role !== "PENDING",
    ) ?? [];

  if (activeStores.length > 0) {
    console.log(
      "[ONBOARDING_LAYOUT] User already has active stores, redirecting to dashboard",
      {
        userId: session.user.id,
        storeCount: activeStores.length,
      },
    );
    redirect("/dashboard");
  }

  return <>{children}</>;
}
