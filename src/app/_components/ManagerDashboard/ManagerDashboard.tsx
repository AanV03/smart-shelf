"use client"

import { useState } from "react"
import { Navbar } from "../shared/navbar"
import { AlertCircle, TrendingUp, Package, Loader2, CheckCircle2 } from "lucide-react"
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-destructive/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <Navbar role="MANAGER" />

        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Monitor inventory metrics, alerts, and system performance
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Inventory Value */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Inventory Value</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {statsLoading ? "—" : `$${(stats?.totalInventoryValue ?? 0).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}`}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/15 p-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Products */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Active Products</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {statsLoading ? "—" : stats?.activeProductCount ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-primary/15 p-3">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Expiring Soon</p>
                    <p className="text-3xl font-bold text-foreground tabular-nums">
                      {statsLoading ? "—" : stats?.expiringCount ?? 0}
                    </p>
                    <p className="text-xs text-warning mt-1">Next 7 days</p>
                  </div>
                  <div className="rounded-lg bg-warning/15 p-3">
                    <AlertCircle className="h-6 w-6 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tab Section */}
          <Card className="border-border/50 bg-linear-to-br from-card via-card/95 to-card/80 backdrop-blur-xl shadow-xl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-border/30 px-6 pt-6">
                <TabsList className="grid w-full grid-cols-4 bg-secondary/20 border border-border/30">
                  <TabsTrigger value="overview" className="rounded-md">Overview</TabsTrigger>
                  <TabsTrigger value="inventory" className="rounded-md">Inventory</TabsTrigger>
                  <TabsTrigger value="alerts" className="rounded-md">Alerts</TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-md">Reports</TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      System Status
                    </h3>
                    <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <div className="size-3 rounded-full bg-primary animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-primary">All systems operational</p>
                        <p className="text-xs text-primary/70">Database connected • API healthy • Sync active</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Last Sync</p>
                      <p className="text-sm font-semibold text-foreground">2 minutes ago</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Uptime</p>
                      <p className="text-sm font-semibold text-foreground">99.9%</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Inventory by Product
                  </h3>
                  <div className="rounded-lg border border-border/30 bg-secondary/30 p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Detailed product list loading...
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Active Alerts ({alerts?.alerts?.length ?? 0})
                  </h3>
                  {alertsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Loading alerts...</span>
                    </div>
                  ) : alerts?.alerts && alerts.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.alerts.slice(0, 5).map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-lg border p-4 transition-colors ${
                            alert.severity === "CRITICAL"
                              ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                              : alert.severity === "WARNING"
                              ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                              : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">
                                {alert.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {format(alert.createdAt, "MMM d, h:mm a")}
                              </p>
                            </div>
                            <Badge
                              className={
                                alert.severity === "CRITICAL"
                                  ? "bg-destructive/20 text-destructive border-destructive/30 border"
                                  : alert.severity === "WARNING"
                                  ? "bg-warning/20 text-warning border-warning/30 border"
                                  : "bg-primary/20 text-primary border-primary/30 border"
                              }
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center">
                      <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        No unread alerts
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Everything is operating normally</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Export & Reports
                  </h3>
                  <div className="rounded-lg border border-border/30 bg-secondary/30 p-8 text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      CSV/XLSX export and historical reports (coming soon)
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  )
}
