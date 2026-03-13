"use client"

import { useMemo } from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { Trash2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/trpc/react"

interface RecentBatchesProps {
  refreshTrigger?: number
}

export function RecentBatches({ refreshTrigger }: RecentBatchesProps) {
  // Fetch todos los batches para el empleado
  const { data: batchesData, isLoading, refetch } = api.inventory.getBatches.useQuery(
    {
      limit: 100,
      offset: 0,
    },
    {
      refetchInterval: 30000, // Auto-refresh cada 30 segundos
    }
  )

  // Filtrar solo los de hoy y mostrar los más recientes primero
  const todayBatches = useMemo(() => {
    const batches = batchesData?.batches ?? []
    return batches
      .filter((batch) => isToday(new Date(batch.createdAt)))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [batchesData?.batches])

  // Refetch cuando el trigger cambie (después de crear un nuevo batch)
  useMemo(() => {
    refetch().catch(() => {
      // Silently catch refetch errors
    })
  }, [refetch])

  const mutation = api.inventory.deleteBatch.useMutation({
    onSuccess: () => {
      void refetch()
    },
  })

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Últimos Lotes Ingresados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Cargando últimas entradas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (todayBatches.length === 0) {
    return (
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Últimos Lotes Ingresados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-muted-foreground">No hay lotes ingresados hoy</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg">
          Últimos Lotes Ingresados ({todayBatches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  Lote
                </th>
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  Producto
                </th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">
                  Cantidad
                </th>
                <th className="text-right px-2 py-2 font-medium text-muted-foreground">
                  Total
                </th>
                <th className="text-left px-2 py-2 font-medium text-muted-foreground">
                  Vence
                </th>
                <th className="text-center px-2 py-2 font-medium text-muted-foreground">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {todayBatches.map((batch) => {
                const isExpiringSoon =
                  new Date(batch.expiresAt).getTime() - new Date().getTime() <
                  7 * 24 * 60 * 60 * 1000 // 7 dias

                return (
                  <tr
                    key={batch.id}
                    className="border-b border-border/20 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-2 py-3 font-mono text-xs font-bold">
                      {batch.batchNumber}
                    </td>
                    <td className="px-2 py-3">
                      <div>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                        <p className="font-medium">{(batch as any).product.name}</p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                        <p className="text-xs text-muted-foreground">{(batch as any).product.sku}</p>
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
                          <span className="text-xs text-warning font-bold">⚠</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => mutation.mutate({ id: batch.id })}
                        disabled={mutation.isPending}
                        aria-label={`Eliminar lote ${batch.batchNumber}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
