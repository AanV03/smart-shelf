"use client"

import Link from "next/link"
import { RecentEntries } from "./RecentEntries"
import { Boxes, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function EmployeeDashboard() {
  // Get batches for today
  const { data: batchesData, isLoading, error } = api.inventory.getBatches.useQuery({
    limit: 50,
    offset: 0,
  })
  
  const batches = batchesData?.batches ?? []
  
  // Calculate totals
  const totalUnitsToday = batches.reduce((acc, batch) => acc + batch.quantity, 0)
  const totalValueToday = batches.reduce((acc, batch) => acc + batch.totalCost, 0)
  const avgBatchValue = batches.length > 0 ? totalValueToday / batches.length : 0

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-secondary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                  Welcome back
                </h1>
                <p className="text-lg text-muted-foreground">
                  Log incoming batches and manage your inventory
                </p>
              </div>
              {batches.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-4 py-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary">{batches.length} batches logged</span>
                </div>
              )}
            </div>
          </div>

          {/* Stats cards - Enhanced visual hierarchy */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Batches Card */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Batches Today</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {isLoading ? "—" : batches.length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/15 p-3">
                    <Boxes className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Units Card */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Units Logged</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {isLoading ? "—" : totalUnitsToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/15 p-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Value Card */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total Value</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {isLoading ? "—" : `$${totalValueToday.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/15 p-3">
                    <span className="text-xl font-bold text-primary">$</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Batch Value Card */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Avg/Batch</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {isLoading ? "—" : `$${avgBatchValue.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/15 p-3">
                    <TrendingUp className="h-6 w-6 text-secondary" />
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
                <Card className="border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm hover:shadow-lg transition-all cursor-pointer hover:border-primary/60 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          Ingresar Nuevo Lote
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Accede al formulario optimizado para entrada rápida de lotes
                        </p>
                      </div>
                      <div className="rounded-lg bg-primary/15 p-4 group-hover:bg-primary/25 transition-colors">
                        <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            {/* Recent Activity - Full width */}
            <div className="lg:col-span-3">
              <Card className="border-border/50 bg-linear-to-br from-card via-card/95 to-card/80 backdrop-blur-xl shadow-xl">
                <CardHeader className="border-b border-border/30 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    📋 Actividad Reciente
                    {batches.length > 0 && (
                      <span className="text-sm font-normal text-primary ml-auto">
                        {batches.length} lotes ingresados
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {error ? (
                    <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 items-start">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Falló al cargar lotes</p>
                        <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
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
  )
}
