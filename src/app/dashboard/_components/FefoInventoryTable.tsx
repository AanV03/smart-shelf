"use client";

import { useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-client";
import { api } from "@/trpc/react";

export function FefoInventoryTable() {
  const { t } = useI18n();
  // Fetch expiring batches (priority for FEFO)
  const { data: expiringData, isLoading: expiringLoading } =
    api.inventory.getExpiringBatches.useQuery({ daysThreshold: 7 });

  // Fetch all batches as backup
  const { data: allBatchesData, isLoading: allBatchesLoading } =
    api.inventory.getBatches.useQuery({
      status: "ACTIVE",
      limit: 200,
      offset: 0,
    });

  // Sort by expiration date (earliest first) - FEFO methodology
  const sortedBatches = useMemo(() => {
    const expiringBatches = expiringData ?? [];
    return [...expiringBatches].sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
    );
  }, [expiringData]);

  // Calculate urgency metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const critical = sortedBatches.filter(
      (b) => differenceInDays(new Date(b.expiresAt), today) <= 1,
    ).length;
    const warning = sortedBatches.filter((b) => {
      const days = differenceInDays(new Date(b.expiresAt), today);
      return days > 1 && days <= 3;
    }).length;
    const caution = sortedBatches.filter((b) => {
      const days = differenceInDays(new Date(b.expiresAt), today);
      return days > 3 && days <= 7;
    }).length;

    return { critical, warning, caution, total: sortedBatches.length };
  }, [sortedBatches]);

  const allBatches = allBatchesData?.batches ?? [];
  const isLoading = expiringLoading || allBatchesLoading;

  if (isLoading) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="text-primary h-5 w-5" />
            {t.inventoryTables.fefo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
            <span className="text-muted-foreground ml-2">
              {t.inventoryTables.fefo.loadingMessage}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sortedBatches.length === 0) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="text-primary h-5 w-5" />
            {t.inventoryTables.fefo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <AlertCircle className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-center">
              {t.inventoryTables.fefo.excellentCondition}
            </p>
            <p className="text-muted-foreground text-center text-sm">
              {t.inventoryTables.fefo.activeProductsLabel} {allBatches.length}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Critical */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  {t.inventoryTables.fefo.critical}
                </p>
                <p className="text-destructive text-3xl font-bold">
                  {metrics.critical}
                </p>
              </div>
              <AlertTriangle className="text-destructive h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  {t.inventoryTables.fefo.warning}
                </p>
                <p className="text-warning text-3xl font-bold">
                  {metrics.warning}
                </p>
              </div>
              <Clock className="text-warning h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Caution */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  {t.inventoryTables.fefo.caution}
                </p>
                <p className="text-primary text-3xl font-bold">
                  {metrics.caution}
                </p>
              </div>
              <AlertCircle className="text-primary h-5 w-5 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="text-primary h-5 w-5" />
            {t.inventoryTables.fefo.actionsRequired} ({metrics.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border/30 border-b">
                  <th className="text-foreground px-3 py-3 text-left font-semibold">
                    {t.inventoryTables.fefo.product}
                  </th>
                  <th className="text-foreground px-3 py-3 text-right font-semibold">
                    {t.inventoryTables.fefo.quantity}
                  </th>
                  <th className="text-foreground px-3 py-3 text-left font-semibold">
                    {t.inventoryTables.fefo.batch}
                  </th>
                  <th className="text-foreground px-3 py-3 text-center font-semibold">
                    {t.inventoryTables.fefo.expires}
                  </th>
                  <th className="text-foreground px-3 py-3 text-center font-semibold">
                    {t.inventoryTables.fefo.action}
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

                  let urgency: "critical" | "warning" | "caution" = "caution";
                  if (daysLeft <= 1) urgency = "critical";
                  else if (daysLeft <= 3) urgency = "warning";

                  const urgencyConfig = {
                    critical: {
                      bgColor: "bg-destructive/10",
                      borderColor: "border-l-4 border-l-destructive",
                      badgeVariant: "destructive" as const,
                      label: t.inventoryTables.fefo.today,
                      description: t.inventoryTables.fefo.criticalAction,
                    },
                    warning: {
                      bgColor: "bg-warning/10",
                      borderColor: "border-l-4 border-l-warning",
                      badgeVariant: "default" as const,
                      label: `${daysLeft}d`,
                      description: t.inventoryTables.fefo.warningAction,
                    },
                    caution: {
                      bgColor: "bg-primary/5",
                      borderColor: "border-l-4 border-l-primary",
                      badgeVariant: "default" as const,
                      label: `${daysLeft}d`,
                      description: t.inventoryTables.fefo.cautionAction,
                    },
                  };

                  const config = urgencyConfig[urgency];

                  return (
                    <tr
                      key={batch.id}
                      className={`${config.bgColor} ${config.borderColor} hover:bg-muted/40 transition-colors`}
                    >
                      {/* Product Info */}
                      <td className="px-3 py-4">
                        <div>
                          <p className="text-foreground font-bold">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                            {(batch as any).Product.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                            {(batch as any).Product.sku}
                          </p>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="text-foreground px-3 py-4 text-right font-mono font-bold">
                        {batch.quantity.toLocaleString()}
                      </td>

                      {/* Batch Number */}
                      <td className="px-3 py-4">
                        <Badge variant="outline" className="font-mono text-xs">
                          {batch.batchNumber}
                        </Badge>
                      </td>

                      {/* Expiration Date */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={config.badgeVariant}>
                            {config.label}
                          </Badge>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(batch.expiresAt), "dd MMM", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Action Label */}
                      <td className="px-3 py-4 text-center">
                        <p className="text-foreground mx-auto max-w-[100px] text-xs font-semibold">
                          {config.description}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="border-border/20 mt-6 border-t pt-4">
            <p className="text-foreground mb-3 text-xs font-semibold">
              📌 Metodología FEFO (First-Expired, First-Out):
            </p>
            <ul className="text-muted-foreground grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              <li>
                ✓ Siempre mueve productos más próximos a expirar al frente
              </li>
              <li>✓ Vende lo más antiguo primero para evitar merma</li>
              <li>✓ Revisa esta tabla cada turno para coordinar acciones</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
