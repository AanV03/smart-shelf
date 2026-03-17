"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Settings,
  TrendingUp,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n-client";

export default function AdminDashboard() {
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
            <h1 className="text-foreground mb-2 flex items-center gap-2 text-4xl font-bold tracking-tight">
              <Building2 className="text-primary h-8 w-8" />
              {t.dashboard.admin.title}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t.dashboard.admin.subtitle}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Inventory Value */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.admin.inventoryValue}
                    </p>
                    <p className="text-foreground text-2xl font-bold tabular-nums">
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
                      {t.dashboard.admin.products}
                    </p>
                    <p className="text-foreground text-2xl font-bold tabular-nums">
                      {statsLoading ? "—" : (stats?.activeProductCount ?? 0)}
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <Package className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.admin.teamMembers}
                    </p>
                    <p className="text-foreground text-2xl font-bold tabular-nums">
                      —
                    </p>
                  </div>
                  <div className="bg-primary/15 rounded-lg p-3">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground mb-2 text-sm font-medium">
                      {t.dashboard.admin.status}
                    </p>
                    <Badge className="border-green-500/30 bg-green-500/20 text-green-700 dark:text-green-400">
                      {t.dashboard.admin.operational}
                    </Badge>
                  </div>
                  <div className="rounded-lg bg-green-500/15 p-3">
                    <Settings className="h-6 w-6 text-green-600" />
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
                    {t.dashboard.admin.overviewTab}
                  </TabsTrigger>
                  <TabsTrigger value="team" className="rounded-md">
                    {t.dashboard.admin.teamTab}
                  </TabsTrigger>
                  <TabsTrigger value="alerts" className="rounded-md">
                    {t.dashboard.admin.alertsTab}
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-md">
                    {t.dashboard.admin.settingsTab}
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6 px-6 pb-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-foreground mb-4 text-lg font-semibold">
                      {t.dashboard.admin.storeConfiguration}
                    </h3>
                    <div className="space-y-4">
                      <div className="border-border/30 flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="text-foreground font-medium">
                            {t.dashboard.admin.storeName}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {t.dashboard.admin.yourMainStore}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          {t.actions.edit}
                        </Button>
                      </div>
                      <div className="border-border/30 flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <p className="text-foreground font-medium">
                            {t.dashboard.admin.storeLocation}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {t.dashboard.admin.updateAddress}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          {t.actions.edit}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    {t.dashboard.admin.manageTeamMembers}
                  </h3>
                  <div className="border-border/30 bg-secondary/30 rounded-lg border p-8 text-center">
                    <Users className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">{t.dashboard.admin.comingSoon}</p>
                    <p className="text-muted-foreground/70 mt-2 text-xs">
                      {t.dashboard.admin.inviteTeamMembers}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Alerts Tab */}
              <TabsContent value="alerts" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    {t.dashboard.admin.recentAlerts}
                  </h3>
                  {alertsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="text-primary h-6 w-6 animate-spin" />
                    </div>
                  ) : alerts?.alerts && alerts.alerts.length > 0 ? (
                    <div className="space-y-2">
                      {alerts.alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="border-border/30 flex items-start gap-3 rounded-lg border p-4"
                        >
                          <AlertCircle className="text-warning mt-1 h-5 w-5 shrink-0" />
                          <div className="flex-1">
                            <p className="text-foreground text-sm font-medium">
                              {alert.message}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {format(new Date(alert.createdAt), "PPp")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border-border/30 bg-secondary/30 rounded-lg border p-8 text-center">
                      <p className="text-muted-foreground text-sm">{t.dashboard.admin.noAlerts}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-6 px-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-foreground text-lg font-semibold">
                    {t.dashboard.admin.systemSettings}
                  </h3>
                  <div className="border-border/30 bg-secondary/30 rounded-lg border p-8 text-center">
                    <Settings className="text-muted-foreground/50 mx-auto mb-4 h-12 w-12" />
                    <p className="text-muted-foreground text-sm">{t.dashboard.admin.comingSoon}</p>
                    <p className="text-muted-foreground/70 mt-2 text-xs">
                      {t.dashboard.admin.configureAdvanced}
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
