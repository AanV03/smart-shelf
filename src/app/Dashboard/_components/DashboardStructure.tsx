'use client';

import { Suspense } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/_components/shared/sidebar";
import { AppTopBar } from "@/app/_components/shared/app-top-bar";

interface DashboardStructureProps {
  children: React.ReactNode;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
}

export function DashboardStructure({ children, role }: DashboardStructureProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar role={role} />
        
        <SidebarInset className="flex flex-col flex-1 h-full">
          <AppTopBar role={role} />
          
          <main className="flex-1 overflow-y-auto p-6">
            <Suspense fallback={<LoadingFallback />}>
              {children}
            </Suspense>
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
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

