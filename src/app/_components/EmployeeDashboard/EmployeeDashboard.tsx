"use client"

import { Navbar } from "../shared/navbar"
import { BatchEntryForm } from "./BatchEntryForm"
import { RecentEntries } from "./RecentEntries"
import { Boxes, TrendingUp, AlertCircle } from "lucide-react"
import { api } from "@/trpc/react"

export default function EmployeeDashboard() {
  const utils = api.useUtils()
  
  // Get batches for today
  const { data: batchesData, isLoading, error } = api.inventory.getBatches.useQuery({
    limit: 50,
    offset: 0,
  })
  
  const batches = batchesData?.batches ?? []
  
  // Calculate totals
  const totalUnitsToday = batches.reduce((acc, batch) => acc + batch.quantity, 0)
  const totalValueToday = batches.reduce((acc, batch) => acc + batch.totalCost, 0)

  const handleBatchCreated = () => {
    // Refresh batches after creating one
    void utils.inventory.getBatches.invalidate()
  }

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle radial glow effects */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 size-[500px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Navbar role="EMPLOYEE" />

        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Page heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Batch Entry
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Log incoming product batches for FEFO-optimized inventory tracking
            </p>
          </div>

          {/* Stats bar */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">
                  Batches Today
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {isLoading ? "—" : batches.length}
              </p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium text-muted-foreground">
                  Units Logged
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {isLoading ? "—" : totalUnitsToday.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm sm:col-span-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary" aria-hidden="true">$</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Total Value
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {isLoading ? "—" : `$${totalValueToday.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
              </p>
            </div>
          </div>

          {/* Main content: Form + Recent Entries */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Form Card */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl lg:p-8">
                <div className="mb-6">
                  <h3 className="text-base font-semibold text-foreground">
                    New Batch
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Fill in the details from the supplier shipment
                  </p>
                </div>
                <BatchEntryForm onSuccess={handleBatchCreated} />
              </div>
            </div>

            {/* Recent Entries Sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl">
                {error ? (
                  <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                    <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Failed to load batches</p>
                      <p className="text-xs text-destructive/80 mt-1">{error.message}</p>
                    </div>
                  </div>
                ) : (
                  <RecentEntries batches={batches} isLoading={isLoading} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
