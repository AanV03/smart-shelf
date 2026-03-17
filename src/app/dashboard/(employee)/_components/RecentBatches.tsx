"use client";

import { useMemo } from "react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-client";
import { api } from "@/trpc/react";

interface RecentBatchesProps {
  refreshTrigger?: number;
}

export function RecentBatches({ refreshTrigger }: RecentBatchesProps) {
  const { t } = useI18n();
  // Fetch todos los batches para el empleado
  const {
    data: batchesData,
    isLoading,
    refetch,
  } = api.inventory.getBatches.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      refetchInterval: 30000, // Auto-refresh cada 30 segundos
    },
  );

  // Filtrar solo los de hoy y mostrar los más recientes primero
  const todayBatches = useMemo(() => {
    const batches = batchesData?.batches ?? [];
    return batches
      .filter((batch) => isToday(new Date(batch.createdAt)))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [batchesData?.batches]);

  // Refetch cuando el trigger cambie (después de crear un nuevo batch)
  useMemo(() => {
    refetch().catch(() => {
      // Silently catch refetch errors
    });
  }, [refetch]);

  const mutation = api.inventory.deleteBatch.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  if (isLoading) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t.recentBatches.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              {t.recentBatches.loadingMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (todayBatches.length === 0) {
    return (
      <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t.recentBatches.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <AlertCircle className="text-muted-foreground h-6 w-6" />
            <p className="text-muted-foreground">{t.recentBatches.noBatchesToday}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          {t.recentBatches.title} ({todayBatches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/30 border-b">
                <th className="text-muted-foreground px-2 py-2 text-left font-medium">
                  {t.recentBatches.batch}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-left font-medium">
                  {t.recentBatches.product}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-right font-medium">
                  {t.recentBatches.quantity}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-right font-medium">
                  {t.recentBatches.total}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-left font-medium">
                  {t.recentBatches.expires}
                </th>
                <th className="text-muted-foreground px-2 py-2 text-center font-medium">
                  {t.recentBatches.action}
                </th>
              </tr>
            </thead>
            <tbody>
              {todayBatches.map((batch) => {
                const isExpiringSoon =
                  new Date(batch.expiresAt).getTime() - new Date().getTime() <
                  7 * 24 * 60 * 60 * 1000; // 7 dias

                return (
                  <tr
                    key={batch.id}
                    className="border-border/20 hover:bg-muted/30 border-b transition-colors"
                  >
                    <td className="px-2 py-3 font-mono text-xs font-bold">
                      {batch.batchNumber}
                    </td>
                    <td className="px-2 py-3">
                      <div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                        <p className="font-medium">
                          {(batch as any).Product.name}
                        </p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                        <p className="text-muted-foreground text-xs">
                          {(batch as any).Product.sku}
                        </p>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right font-mono">
                      {batch.quantity.toLocaleString()}
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-bold">
                      ${batch.totalCost.toFixed(2)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={isExpiringSoon ? "destructive" : "default"}
                          className="text-xs"
                        >
                          {format(new Date(batch.expiresAt), "dd MMM", {
                            locale: es,
                          })}
                        </Badge>
                        {isExpiringSoon && (
                          <span className="text-warning text-xs font-bold">
                            ⚠
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => mutation.mutate({ id: batch.id })}
                        disabled={mutation.isPending}
                        aria-label={t.recentBatches.deleteBatchAriaLabel.replace("{batchNumber}", batch.batchNumber)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
