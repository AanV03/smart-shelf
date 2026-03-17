"use client";

import { useState } from "react";
import {
  AlertCircle,
  TrendingUp,
  Package,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-client";

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { t } = useI18n();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } =
    api.stats.getDashboardStats.useQuery();

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading } =
    api.alerts.getAlerts.useQuery({
      isRead: false,
      limit: 10,
    });

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-primary/20 animate-blob absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-70 mix-blend-multiply blur-3xl filter" />
        <div className="bg-destructive/15 animate-blob animation-delay-2000 absolute right-0 -bottom-40 h-96 w-96 rounded-full opacity-50 mix-blend-multiply blur-3xl filter" />
        <div className="bg-primary/10 animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <h1 className="text-foreground mb-2 text-4xl font-bold tracking-tight">
              {t.dashboard.manager.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.dashboard.manager.subtitle}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Inventory Value */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.manager.inventoryValue}
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {statsLoading
                        ? "—"
                        : `$${(stats?.totalInventoryValue ?? 0).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            },
                          )}`}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Products */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.manager.activeProducts}
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {statsLoading ? "—" : (stats?.activeProductCount ?? 0)}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <Package className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expiring Soon */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.manager.expiringSoon}
                    </p>
                    <p className="text-foreground text-3xl font-bold tabular-nums">
                      {statsLoading ? "—" : (stats?.expiringCount ?? 0)}
                    </p>
                    <p className="text-warning mt-1 text-xs">{t.dashboard.manager.expiringNext7}</p>
                  </div>
                  <div className="bg-warning/15 rounded-lg p-3">
                    <AlertCircle className="text-warning h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tab Section */}
          <Card className="border-border/50 from-card via-card/95 to-card/80 bg-linear-to-br shadow-xl backdrop-blur-xl">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="border-border/30 border-b px-6 pt-6">
                <TabsList className="bg-secondary/20 border-border/30 grid w-full grid-cols-4 border">
                  <TabsTrigger value="overview" className="rounded-md">
                    {t.dashboard.manager.title}
                  </TabsTrigger>
                  <TabsTrigger value="inventory" className="rounded-md">
                    {t.inventory.title}
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="rounded-md">
                    {t.dashboard.manager.activeAlerts}
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="rounded-md">
                    {t.reports.title}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-foreground mb-4 text-lg font-semibold">
                      {t.dashboard.manager.systemStatus}
                    </h3>
                    <div className="border-primary/30 bg-primary/5 flex items-center gap-3 rounded-lg border p-4">
                      <div className="bg-primary size-3 animate-pulse rounded-full" />
                      <div>
                        <p className="text-primary text-sm font-medium">
                          {t.dashboard.manager.allSystemsOperational}
                        </p>
                        <p className="text-primary/70 text-xs">
                          {t.dashboard.manager.databaseConnected} • {t.dashboard.manager.apiHealthy} •{" "}
                          {t.dashboard.manager.syncActive}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-border/30 bg-secondary/30 rounded-lg border p-4">
                      <p className="text-muted-foreground mb-2 text-xs font-medium">
                        {t.dashboard.manager.lastSync}
                      </p>
                      <p className="text-foreground text-sm font-semibold">
                        2 {t.dashboard.manager.minutesAgo}
                      </p>
                    </div>
                    <div className="border-border/30 bg-secondary/30 rounded-lg border p-4">
                      <p className="text-muted-foreground mb-2 text-xs font-medium">
                        {t.dashboard.manager.uptime}
                      </p>
                      <p className="text-foreground text-sm font-semibold">
                        99.9%
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Inventory Tab */}
              <TabsContent value="inventory" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    {t.dashboard.manager.inventoryByProduct}
                  </h3>
                  <div className="border-border/30 bg-secondary/30 rounded-lg border p-8 text-center">
                    <Package className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">
                      {t.dashboard.manager.detailedProductListLoading}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground mb-4 text-lg font-semibold">
                    {t.dashboard.manager.activeAlerts} ({alerts?.alerts?.length ?? 0})
                  </h3>
                  {alertsLoading ? (
                    <div className="flex items-center justify-center gap-2 py-12">
                      <Loader2 className="text-primary size-5 animate-spin" />
                      <span className="text-muted-foreground text-sm">
                        {t.dashboard.manager.loadingAlerts}
                      </span>
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
                              <p className="text-foreground text-sm font-medium">
                                {alert.message}
                              </p>
                              <p className="text-muted-foreground mt-2 text-xs">
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
                    <div className="border-primary/20 bg-primary/5 rounded-lg border p-6 text-center">
                      <CheckCircle2 className="text-primary mx-auto mb-3 h-8 w-8" />
                      <p className="text-foreground text-sm font-medium">
                        {t.dashboard.manager.noUnreadAlerts}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {t.dashboard.manager.everythingOperatingNormally}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    {t.dashboard.manager.exportAndReports}
                  </h3>
                  <div className="border-border/30 bg-secondary/30 rounded-lg border p-8 text-center">
                    <TrendingUp className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">
                      {t.dashboard.manager.csvXlsxExport}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  );
}
