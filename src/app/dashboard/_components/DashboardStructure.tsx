"use client";

import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/shared/sidebar";
import { AppTopBar } from "@/app/_components/shared/app-top-bar";

interface DashboardStructureProps {
  children: React.ReactNode;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export function DashboardStructure({
  children,
  role,
}: DashboardStructureProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar role={role} />

        <SidebarInset className="flex h-full flex-1 flex-col">
          <AppTopBar role={role} />

          <main className="flex-1 overflow-y-auto p-6">
            <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function LoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  );
}
