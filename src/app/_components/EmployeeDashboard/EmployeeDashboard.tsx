"use client";

import Link from "next/link";
import { RecentEntries } from "./RecentEntries";
import {
  Boxes,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeDashboard() {
  // Get batches for today
  const {
    data: batchesData,
    isLoading,
    error,
  } = api.inventory.getBatches.useQuery({
    limit: 50,
    offset: 0,
  });

  const batches = batchesData?.batches ?? [];

  // Calculate totals
  const totalUnitsToday = batches.reduce(
    (acc, batch) => acc + batch.quantity,
    0,
  );
  const totalValueToday = batches.reduce(
    (acc, batch) => acc + batch.totalCost,
    0,
  );
  const avgBatchValue =
    batches.length > 0 ? totalValueToday / batches.length : 0;

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-primary/20 animate-blob absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-70 mix-blend-multiply blur-3xl filter" />
        <div className="bg-secondary/15 animate-blob animation-delay-2000 absolute right-0 -bottom-40 h-96 w-96 rounded-full opacity-50 mix-blend-multiply blur-3xl filter" />
        <div className="bg-primary/10 animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-muted-foreground text-lg">
                  Log incoming batches and manage your inventory
                </p>
              </div>
              {batches.length > 0 && (
                <div className="bg-primary/10 border-primary/30 flex items-center gap-2 rounded-lg border px-4 py-2">
                  <CheckCircle2 className="text-primary h-5 w-5" />
                  <span className="text-primary text-sm font-medium">
                    {batches.length} batches logged
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats cards - Enhanced visual hierarchy */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Batches Card */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      Batches Today
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {isLoading ? "—" : batches.length}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <Boxes className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Units Card */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      Units Logged
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {isLoading ? "—" : totalUnitsToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Value Card */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      Total Value
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {isLoading
                        ? "—"
                        : `$${totalValueToday.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <span className="text-primary text-xl font-bold">$</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Batch Value Card */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      Avg/Batch
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {isLoading
                        ? "—"
                        : `$${avgBatchValue.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}`}
                    </p>
                  </div>
                  <div className="bg-secondary/15 rounded-lg p-3">
                    <TrendingUp className="text-secondary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content: Quick Actions + Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick Action - Ingresar Lote */}
            <div className="lg:col-span-3">
              <Link href="/dashboard/batch-entry">
                <Card className="border-primary/40 from-primary/10 to-primary/5 hover:border-primary/60 group cursor-pointer bg-linear-to-br backdrop-blur-sm transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-foreground group-hover:text-primary text-lg font-bold transition-colors">
                          Ingresar Nuevo Lote
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          Accede al formulario optimizado para entrada rápida de
                          lotes
                        </p>
                      </div>
                      <div className="bg-primary/15 group-hover:bg-primary/25 rounded-lg p-4 transition-colors">
                        <ArrowRight className="text-primary h-6 w-6 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Activity - Full width */}
            <div className="lg:col-span-3">
              <Card className="border-border/50 from-card via-card/95 to-card/80 bg-linear-to-br shadow-xl backdrop-blur-xl">
                <CardHeader className="border-border/30 border-b pb-4">
                  <CardTitle className="flex items-center gap-2">
                    📋 Actividad Reciente
                    {batches.length > 0 && (
                      <span className="text-primary ml-auto text-sm font-normal">
                        {batches.length} lotes ingresados
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {error ? (
                    <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4">
                      <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
                      <div>
                        <p className="text-destructive text-sm font-medium">
                          Falló al cargar lotes
                        </p>
                        <p className="text-destructive/80 mt-1 text-xs">
                          {error.message}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <RecentEntries batches={batches} isLoading={isLoading} />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
