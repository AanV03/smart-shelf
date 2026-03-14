"use client";

import { useMemo } from "react";
import { format, differenceInDays, isPast } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Loader2,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";

export function StrategicInventoryTable() {
  // Fetch all batches
  const { data: batchesData, isLoading: batchesLoading } =
    api.inventory.getBatches.useQuery({
      status: "ACTIVE",
      limit: 500,
      offset: 0,
    });

  // Fetch inventory value
  const { data: valueData, isLoading: valueLoading } =
    api.inventory.getTotalInventoryValue.useQuery();

  // Fetch expiring batches for risk analysis
  const { data: expiringData, isLoading: expiringLoading } =
    api.inventory.getExpiringBatches.useQuery({ daysThreshold: 30 });

  const batches = useMemo(
    () => batchesData?.batches ?? [],
    [batchesData?.batches],
  );
  const totalValue = valueData?.totalValue ?? 0;
  const expiringBatches = useMemo(() => expiringData ?? [], [expiringData]);

  const isLoading = batchesLoading || valueLoading || expiringLoading;

  // Calculate financial metrics
  const metrics = useMemo(() => {
    const today = new Date();

    // Value at risk (high-value items expiring soon)
    const valueAtRisk = expiringBatches
      .filter((b) => differenceInDays(new Date(b.expiresAt), today) <= 7)
      .reduce((sum, b) => sum + b.totalCost, 0);

    // Retention days (average days until expiration)
    const avgRetentionDays =
      batches.length > 0
        ? batches.reduce((sum, b) => {
            const days = differenceInDays(new Date(b.expiresAt), today);
            return sum + Math.max(0, days);
          }, 0) / batches.length
        : 0;

    // High-value retention (products > $1000)
    const highValueBatches = batches.filter((b) => b.totalCost > 1000);
    const highValueTotal = highValueBatches.reduce(
      (sum, b) => sum + b.totalCost,
      0,
    );

    return {
      valueAtRisk,
      avgRetentionDays: Math.round(avgRetentionDays),
      highValueBatches: highValueBatches.length,
      highValueTotal,
      totalBatches: batches.length,
    };
  }, [batches, expiringBatches]);

  // Sort batches by value (highest first) for strategic decision
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => b.totalCost - a.totalCost).slice(0, 50); // Top 50 products by value
  }, [batches]);

  if (isLoading) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="text-primary h-5 w-5" />
            Inventario Estratégico - Análisis de Valor y Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              Analizando inventario...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Inventory Value */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Valor Total Inventario
                </p>
                <p className="text-foreground text-2xl font-bold tabular-nums">
                  $
                  {totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <DollarSign className="text-primary h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Value at Risk */}
        <Card
          className={
            metrics.valueAtRisk > 0
              ? "border-warning/30 bg-warning/5"
              : "border-primary/30 bg-primary/5"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Valor en Riesgo (7 días)
                </p>
                <p
                  className={`text-2xl font-bold tabular-nums ${metrics.valueAtRisk > 0 ? "text-warning" : "text-primary"}`}
                >
                  $
                  {metrics.valueAtRisk.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <AlertTriangle className="text-warning h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Average Retention */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Días Retención Promedio
                </p>
                <p className="text-foreground text-2xl font-bold">
                  {metrics.avgRetentionDays}
                </p>
              </div>
              <Eye className="text-primary h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* High Value Batches */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  Productos Alto Valor (&gt;$1K)
                </p>
                <p className="text-foreground text-2xl font-bold">
                  {metrics.highValueBatches}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  $
                  {metrics.highValueTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
              <TrendingUp className="text-primary h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Strategic Table (Top products by value) */}
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            Top 50 Productos por Valor de Retención
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/30 border-b">
                  <th className="text-foreground px-3 py-3 text-left font-semibold">
                    Producto
                  </th>
                  <th className="text-foreground px-3 py-3 text-right font-semibold">
                    Unidades
                  </th>
                  <th className="text-foreground px-3 py-3 text-right font-semibold">
                    Valor Total
                  </th>
                  <th className="text-foreground px-3 py-3 text-right font-semibold">
                    Costo Unit.
                  </th>
                  <th className="text-foreground px-3 py-3 text-center font-semibold">
                    Vence
                  </th>
                  <th className="text-foreground px-3 py-3 text-center font-semibold">
                    Riesgo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border/20 divide-y">
                {sortedBatches.map((batch) => {
                  const today = new Date();
                  const daysLeft = differenceInDays(
                    new Date(batch.expiresAt),
                    today,
                  );
                  const isExpired = isPast(new Date(batch.expiresAt));

                  let riskLevel: "critical" | "high" | "medium" | "low" = "low";
                  if (isExpired) riskLevel = "critical";
                  else if (daysLeft <= 3) riskLevel = "high";
                  else if (daysLeft <= 7) riskLevel = "medium";

                  const riskConfig = {
                    critical: {
                      color: "text-destructive",
                      bgColor: "bg-destructive/10",
                      label: "🔴 EXPIRADO",
                    },
                    high: {
                      color: "text-warning",
                      bgColor: "bg-warning/10",
                      label: "🟠 ALTO",
                    },
                    medium: {
                      color: "text-primary",
                      bgColor: "bg-primary/10",
                      label: "🟡 MEDIO",
                    },
                    low: {
                      color: "text-muted-foreground",
                      bgColor: "bg-muted/20",
                      label: "🟢 BAJO",
                    },
                  };

                  const config = riskConfig[riskLevel];

                  return (
                    <tr
                      key={batch.id}
                      className={`${config.bgColor} hover:bg-muted/40 transition-colors`}
                    >
                      {/* Product */}
                      <td className="px-3 py-4">
                        <div>
                          <p className="text-foreground font-bold">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                            {(batch as any).Product.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                            {(batch as any).Product.sku} • Lote:{" "}
                            {batch.batchNumber}
                          </p>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="text-foreground px-3 py-4 text-right font-mono">
                        {batch.quantity.toLocaleString()}
                      </td>

                      {/* Total Value */}
                      <td
                        className={`px-3 py-4 text-right font-mono font-bold ${config.color}`}
                      >
                        $
                        {batch.totalCost.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>

                      {/* Cost Per Unit */}
                      <td className="text-muted-foreground px-3 py-4 text-right font-mono">
                        ${batch.costPerUnit.toFixed(2)}
                      </td>

                      {/* Expiration */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge
                            variant={
                              isExpired || daysLeft <= 3
                                ? "destructive"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {isExpired ? "EXPIRADO" : `${daysLeft}d`}
                          </Badge>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(batch.expiresAt), "dd MMM", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="px-3 py-4 text-center">
                        <Badge
                          variant={
                            riskLevel === "critical" || riskLevel === "high"
                              ? "destructive"
                              : riskLevel === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {config.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer insights */}
          <div className="border-border/20 mt-6 space-y-3 border-t pt-4">
            <p className="text-foreground text-xs font-semibold">
              📊 Insights para Decisiones:
            </p>
            <ul className="text-muted-foreground grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <li>
                ✓ Enfócate en reducir valor en riesgo mediante promociones
              </li>
              <li>✓ Monitorea productos de alto valor próximos a expirar</li>
              <li>
                ✓ Los días de retención promedio indican salud del inventario
              </li>
              <li>✓ Productos rojos requieren acción inmediata de gerencia</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
