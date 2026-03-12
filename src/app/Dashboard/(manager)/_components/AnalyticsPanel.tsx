"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { BarChart3, Download, TrendingDown, AlertTriangle, PieChart as PieChartIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"

export function AnalyticsPanel() {
  // Main dashboard stats
  const { data: dashboardStats, isLoading: statsLoading } = api.stats.getDashboardStats.useQuery()

  // Inventory by category
  const { data: categoryData, isLoading: categoryLoading } = api.stats.getInventoryByCategory.useQuery()

  // Expiration trend (30 days)
  const { data: trendData, isLoading: trendLoading } = api.stats.getExpirationTrend.useQuery({
    days: 30,
  })

  // Alerts
  const { data: alertsData, isLoading: alertsLoading } = api.alerts.getAlerts.useQuery({
    severity: "CRITICAL",
    limit: 10,
  })

  const isLoading = statsLoading || categoryLoading || trendLoading || alertsLoading

  // Find max value for scaling the trend chart
  const maxTrendValue = useMemo(() => {
    if (!trendData) return 1
    return Math.max(...trendData.map((d) => d.expiringCount || 0), 1)
  }, [trendData])

  // Find max category value
  const maxCategoryValue = useMemo(() => {
    if (!categoryData) return 1
    return Math.max(...categoryData.map((c) => c.totalValue || 0), 1)
  }, [categoryData])

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Análisis y Reportes
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Cargando análisis...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {alertsData && alertsData.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Alertas Críticas ({alertsData.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertsData.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                >
                  <div className="h-2 w-2 rounded-full bg-destructive mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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
            <p className="text-xs font-medium text-muted-foreground mb-2">Valor Total</p>
            <p className="text-3xl font-bold text-foreground tabular-nums">
              ${(dashboardStats?.totalInventoryValue ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Productos Activos</p>
            <p className="text-3xl font-bold text-foreground">
              {dashboardStats?.activeProductCount ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className={dashboardStats?.expiringCount ?? 0 > 10 ? "border-warning/30 bg-warning/5" : "border-primary/30 bg-primary/5"}>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Expirando (7 días)</p>
            <p className={`text-3xl font-bold tabular-nums ${dashboardStats?.expiringCount ?? 0 > 10 ? "text-warning" : "text-foreground"}`}>
              {dashboardStats?.expiringCount ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Alertas Críticas</p>
            <p className="text-3xl font-bold text-destructive">
              {alertsData?.alerts.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiration Trend Chart */}
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
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
            <div className="h-64 flex items-end gap-1 justify-start overflow-x-auto pb-4">
              {trendData && trendData.length > 0 ? (
                trendData.slice(-14).map((point) => {
                  const height = (point.expiringCount / maxTrendValue) * 100
                  const dayOfWeek = format(new Date(point.date), "EEE")
                  return (
                    <div key={point.date} className="flex flex-col items-center gap-2 min-w-fit">
                      {/* Bar */}
                      <div
                        className="w-6 bg-gradient-to-t from-warning to-primary rounded-t transition-all hover:shadow-lg"
                        style={{ height: `${Math.max(height, 5)}px` }}
                        title={`${point.expiringCount} items expiring`}
                      />
                      {/* Date label */}
                      <span className="text-xs text-muted-foreground text-center">
                        {dayOfWeek}
                      </span>
                    </div>
                  )
                })
              ) : (
                <p className="text-muted-foreground text-center w-full">
                  No hay datos de expiración en los próximos 30 días
                </p>
              )}
            </div>

            {/* Chart legend */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-border/20">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-gradient-to-t from-warning to-primary" />
                <span className="text-xs text-muted-foreground">Unidades que vencen por día</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory by Category */}
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribución de Valor por Categoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData && categoryData.length > 0 ? (
              categoryData.map((category) => {
                const percentage = (category.totalValue / (maxCategoryValue * categoryData.length)) * 100
                const displayPercentage = (
                  (category.totalValue /
                    categoryData.reduce((sum, c) => sum + c.totalValue, 0)) *
                  100
                ).toFixed(1)

                return (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{category.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.itemCount} items • ${category.totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <Badge variant="outline">{displayPercentage}%</Badge>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/50 transition-all"
                        style={{
                          width: `${displayPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-muted-foreground text-center py-6">
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
            <h4 className="font-semibold text-foreground">Acciones Recomendadas:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {(dashboardStats?.expiringCount ?? 0) > 5 && (
                <li>🟠 Hay {dashboardStats?.expiringCount} productos próximos a expirar. Considera ejecutar promociones.</li>
              )}
              {(dashboardStats?.alertsUnread ?? 0) > 0 && (
                <li>🔴 {dashboardStats?.alertsUnread} alertas críticas sin leer. Revísalas ahora.</li>
              )}
              {(dashboardStats?.totalInventoryValue ?? 0) > 50000 && (
                <li>💰 Inventario de alto valor. Enfócate en rotación FEFO para minimizar merma.</li>
              )}
              {categoryData && categoryData.length > 0 && (
                <li>📊 La categoría con mayor valor es &quot;{categoryData[0]?.category}&quot;. Monitorea su expiración.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
