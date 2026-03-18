"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  BarChart3,
  Download,
  TrendingDown,
  AlertTriangle,
  PieChart as PieChartIcon,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-client";
import { api } from "@/trpc/react";

export function AnalyticsPanel() {
  const { t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  
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

  // Financial reports (NEW)
  const { data: reportsData, isLoading: reportsLoading } =
    api.reports.getReports.useQuery({
      limit: 10,
      offset: 0,
    });

  const isLoading =
    statsLoading ||
    categoryLoading ||
    trendLoading ||
    alertsLoading ||
    reportsLoading;

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
            {t.analytics.panelTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t.analytics.loadingMessage}</p>
        </CardContent>
      </Card>
    );
  }

  // Handle export functionality
  const handleExportTrend = () => {
    if (!trendData || trendData.length === 0) return;
    
    setIsExporting(true);
    try {
      // Create CSV content
      const trendLabel = t.analytics.trendTitle?.split("(")[0]?.trim() ?? "Trend";
      const headers = [trendLabel, t.analytics.unitsExpiringLabel];
      const rows = (trendData!).map((point) => [
        format(new Date(point.date), "yyyy-MM-dd"),
        point.expiringCount,
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `tendencia-expiracion-${format(new Date(), "yyyy-MM-dd")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("[ANALYTICS_EXPORT_ERROR]", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {alertsData && alertsData.alerts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t.analytics.criticalAlertsTitle.replace("{count}", alertsData.alerts.length.toString())}
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
              {t.analytics.totalValue}
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
              {t.analytics.activeProducts}
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
              {t.analytics.expiringNext7}
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
              {t.analytics.criticalAlertsCount}
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
              {t.analytics.trendTitle}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleExportTrend}
              disabled={isExporting || !trendData || trendData.length === 0}
            >
              <Download className="h-4 w-4" />
              {isExporting ? t.analytics.exportingButton : t.analytics.exportButton}
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
                        title={t.analytics.chartTooltip.replace("{count}", point.expiringCount.toString())}
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
                  {t.analytics.noExpirationData}
                </p>
              )}
            </div>

            {/* Chart legend */}
            <div className="border-border/20 flex items-center justify-center gap-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <div className="from-warning to-primary h-3 w-3 rounded bg-gradient-to-t" />
                <span className="text-muted-foreground text-xs">
                  {t.analytics.unitsExpiringLabel}
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
            {t.analytics.valueByCategoryTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryData && categoryData.length > 0 ? (
              categoryData.map((category) => {
                // Translate category name
                const categoryKey = category.category as keyof typeof t.categories;
                const translatedCategory = t.categories?.[categoryKey] ?? category.category;
                
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
                          {translatedCategory}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.analytics.categoryItemsLabel.replace("{count}", category.itemCount.toString())} $
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
                {t.analytics.noCategoryData}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Reports Section (NEW) */}
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="text-primary h-5 w-5" />
            Reportes Financieros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Cargando reportes...</p>
            </div>
          ) : reportsData && reportsData.reports.length > 0 ? (
            <div className="space-y-3">
              {reportsData.reports.map((report) => (
                <div
                  key={report.id}
                  className="border-border/30 flex items-center justify-between rounded-lg border p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="text-primary h-4 w-4" />
                      <p className="text-foreground font-medium">
                        Período: {report.period}
                      </p>
                    </div>
                    <div className="text-muted-foreground mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold">Ingresos</p>
                        <p className="text-foreground font-bold">
                          ${report.totalRevenue.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Costo</p>
                        <p className="text-foreground font-bold">
                          ${report.totalCost.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Ganancia Neta</p>
                        <p
                          className={`font-bold ${
                            report.netProfit > 0
                              ? "text-green-600"
                              : "text-destructive"
                          }`}
                        >
                          ${report.netProfit.toLocaleString(undefined, {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Generado: {format(new Date(report.generatedAt), "dd MMM yyyy HH:mm")}
                    </p>
                  </div>

                  {/* Download Button */}
                  <div className="flex items-center gap-2">
                    {report.blobUrl ? (
                      <a
                        href={report.blobUrl}
                        download={report.blobFileName ?? `report-${report.period}.csv`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-2 text-primary hover:bg-primary/20 transition-colors"
                        title="Descargar reporte CSV"
                      >
                        <Download className="h-4 w-4" />
                        <span className="text-xs font-medium">Descargar</span>
                      </a>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Procesando...
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <FileText className="text-muted-foreground h-8 w-8" />
              <p className="text-muted-foreground text-center text-sm">
                No hay reportes disponibles aún. Los reportes se generan automáticamente cada 24 horas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Section */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">{t.analytics.insightsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-foreground font-semibold">
              {t.analytics.recommendedActionsLabel}
            </h4>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              {(dashboardStats?.expiringCount ?? 0) > 5 && (
                <li>
                  {t.analytics.recommendationExpiringProducts.replace(
                    "{count}",
                    (dashboardStats?.expiringCount ?? 0).toString()
                  )}
                </li>
              )}
              {(dashboardStats?.alertsUnread ?? 0) > 0 && (
                <li>
                  {t.analytics.recommendationCriticalAlerts.replace(
                    "{count}",
                    (dashboardStats?.alertsUnread ?? 0).toString()
                  )}
                </li>
              )}
              {(dashboardStats?.totalInventoryValue ?? 0) > 50000 && (
                <li>
                  {t.analytics.recommendationHighValue}
                </li>
              )}
              {categoryData && categoryData.length > 0 && (
                <li>
                  {t.analytics.recommendationTopCategory.replace(
                    "{category}",
                    categoryData[0]?.category ?? "N/A"
                  )}
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
