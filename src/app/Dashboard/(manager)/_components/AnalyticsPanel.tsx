"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Download,
  TrendingDown,
  AlertTriangle,
  PieChart as PieChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";

export function AnalyticsPanel() {
  // Main dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } =
    api.stats.getDashboardStats.useQuery();

  // Inventory by category
  const { data: categoryData, isLoading: categoryLoading } =
    api.stats.getInventoryByCategory.useQuery();

  // Expiration trend (30 days)
  const { data: trendData, isLoading: trendLoading } =
    api.stats.getExpirationTrend.useQuery({
      days: 30,
    });

  // Alerts
  const { data: alertsData, isLoading: alertsLoading } =
    api.alerts.getAlerts.useQuery({
      severity: "CRITICAL",
      limit: 10,
    });

  const isLoading =
    statsLoading || categoryLoading || trendLoading || alertsLoading;

  // Find max value for scaling the trend chart
  const maxTrendValue = useMemo(() => {
    if (!trendData) return 1;
    return Math.max(...trendData.map((d) => d.expiringCount || 0), 1);
  }, [trendData]);

  // Find max category value
  const maxCategoryValue = useMemo(() => {
    if (!categoryData) return 1;
    return Math.max(...categoryData.map((c) => c.totalValue || 0), 1);
  }, [categoryData]);

  if (isLoading) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="text-primary h-5 w-5" />
            Análisis y Reportes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando análisis...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {alertsData && alertsData.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticas ({alertsData.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertsData.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="border-destructive/20 bg-destructive/5 flex items-start gap-3 rounded-lg border p-3"
                >
                  <div className="bg-destructive mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" />
                  <div className="flex-1">
                    <p className="text-foreground text-sm font-medium">
                      {alert.message}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {format(new Date(alert.createdAt), "dd MMM HH:mm")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Valor Total
            </p>
            <p className="text-foreground text-3xl font-bold tabular-nums">
              $
              {(dashboardStats?.totalInventoryValue ?? 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                },
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Productos Activos
            </p>
            <p className="text-foreground text-3xl font-bold">
              {dashboardStats?.activeProductCount ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            (dashboardStats?.expiringCount ?? 0 > 10)
              ? "border-warning/30 bg-warning/5"
              : "border-primary/30 bg-primary/5"
          }
        >
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Expirando (7 días)
            </p>
            <p
              className={`text-3xl font-bold tabular-nums ${(dashboardStats?.expiringCount ?? 0 > 10) ? "text-warning" : "text-foreground"}`}
            >
              {dashboardStats?.expiringCount ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-2 text-xs font-medium">
              Alertas Críticas
            </p>
            <p className="text-destructive text-3xl font-bold">
              {alertsData?.alerts.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Trend Chart */}
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="text-primary h-5 w-5" />
              Tendencia de Expiración (30 días)
            </CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="flex h-64 items-end justify-start gap-1 overflow-x-auto pb-4">
              {trendData && trendData.length > 0 ? (
                trendData.slice(-14).map((point) => {
                  const height = (point.expiringCount / maxTrendValue) * 100;
                  const dayOfWeek = format(new Date(point.date), "EEE");
                  return (
                    <div
                      key={point.date}
                      className="flex min-w-fit flex-col items-center gap-2"
                    >
                      {/* Bar */}
                      <div
                        className="from-warning to-primary w-6 rounded-t bg-gradient-to-t transition-all hover:shadow-lg"
                        style={{ height: `${Math.max(height, 5)}px` }}
                        title={`${point.expiringCount} items expiring`}
                      />
                      {/* Date label */}
                      <span className="text-muted-foreground text-center text-xs">
                        {dayOfWeek}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground w-full text-center">
                  No hay datos de expiración en los próximos 30 días
                </p>
              )}
            </div>

            {/* Chart legend */}
            <div className="border-border/20 flex items-center justify-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="from-warning to-primary h-3 w-3 rounded bg-gradient-to-t" />
                <span className="text-muted-foreground text-xs">
                  Unidades que vencen por día
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory by Category */}
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="text-primary h-5 w-5" />
            Distribución de Valor por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData && categoryData.length > 0 ? (
              categoryData.map((category) => {
                const percentage =
                  (category.totalValue /
                    (maxCategoryValue * categoryData.length)) *
                  100;
                const displayPercentage = (
                  (category.totalValue /
                    categoryData.reduce((sum, c) => sum + c.totalValue, 0)) *
                  100
                ).toFixed(1);

                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-foreground font-medium">
                          {category.category}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {category.itemCount} items • $
                          {category.totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <Badge variant="outline">{displayPercentage}%</Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="from-primary to-primary/50 h-full bg-gradient-to-r transition-all"
                        style={{
                          width: `${displayPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground py-6 text-center">
                Sin datos de categoría disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">💡 Insights para Decisiones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-foreground font-semibold">
              Acciones Recomendadas:
            </h4>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              {(dashboardStats?.expiringCount ?? 0) > 5 && (
                <li>
                  🟠 Hay {dashboardStats?.expiringCount} productos próximos a
                  expirar. Considera ejecutar promociones.
                </li>
              )}
              {(dashboardStats?.alertsUnread ?? 0) > 0 && (
                <li>
                  🔴 {dashboardStats?.alertsUnread} alertas críticas sin leer.
                  Revísalas ahora.
                </li>
              )}
              {(dashboardStats?.totalInventoryValue ?? 0) > 50000 && (
                <li>
                  💰 Inventario de alto valor. Enfócate en rotación FEFO para
                  minimizar merma.
                </li>
              )}
              {categoryData && categoryData.length > 0 && (
                <li>
                  📊 La categoría con mayor valor es &quot;
                  {categoryData[0]?.category}&quot;. Monitorea su expiración.
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
