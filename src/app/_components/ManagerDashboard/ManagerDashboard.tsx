"use client"

import { useState } from "react"
import { Navbar } from "../shared/navbar"
import { AlertCircle, TrendingUp, Package, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/trpc/react"
import { format } from "date-fns"

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = api.stats.getDashboardStats.useQuery()
  
  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } = api.alerts.getAlerts.useQuery({
    isRead: false,
    limit: 10,
  })

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle radial glow effects */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute -top-40 left-1/4 size-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-40 right-1/4 size-[500px] rounded-full bg-destructive/3 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <Navbar role="MANAGER" />

        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Page heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Manager Dashboard
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Monitor inventory, alerts, and financial metrics
            </p>
          </div>

          {/* Stats Summary */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Inventory Value */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="size-4 text-primary" aria-hidden="true" />
                  Inventory Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums text-foreground">
                  {statsLoading ? "—" : `$${(stats?.totalInventoryValue ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total current valuation
                </p>
              </CardContent>
            </Card>

            {/* Active Products */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Package className="size-4 text-primary" aria-hidden="true" />
                  Active Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums text-foreground">
                  {statsLoading ? "—" : stats?.activeProductCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Unique SKUs in stock
                </p>
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <AlertCircle className="size-4 text-warning" aria-hidden="true" />
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums text-foreground">
                  {statsLoading ? "—" : stats?.expiringCount ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Due in next 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Inventory, Analytics, Alerts, Reports */}
          <div className="rounded-2xl border border-border/40 bg-card/60 p-6 backdrop-blur-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    System Status
                  </h3>
                  <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-secondary/30 p-4">
                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-sm text-foreground">
                      All systems operational
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Placeholder for dashboard analytics and KPIs
                  </p>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Inventory by Product
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed product list and batch tracking (mock data)
                  </p>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Active Alerts
                  </h3>
                  {alertsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12">
                      <Loader2 className="size-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Loading alerts...</span>
                    </div>
                  ) : alerts?.alerts && alerts.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-lg border p-4 ${
                            alert.severity === "CRITICAL"
                              ? "border-destructive/30 bg-destructive/5"
                              : alert.severity === "WARNING"
                              ? "border-warning/30 bg-warning/5"
                              : "border-primary/30 bg-primary/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground text-sm">
                                {alert.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(alert.createdAt, "MMM d, h:mm a")}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                alert.severity === "CRITICAL"
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : alert.severity === "WARNING"
                                  ? "bg-warning/10 text-warning border-warning/30"
                                  : "bg-primary/10 text-primary border-primary/30"
                              }
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm text-foreground">
                        No unread alerts
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">
                    Export & Reports
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    CSV/XLSX export and historical reporting (coming soon)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
