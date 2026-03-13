"use client"

import { useMemo } from "react"
import { format, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertTriangle,
  AlertCircle,
  Clock,
  TrendingDown,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/trpc/react"

export function FefoInventoryTable() {
  // Fetch expiring batches (priority for FEFO)
  const { data: expiringData, isLoading: expiringLoading } =
    api.inventory.getExpiringBatches.useQuery({ daysThreshold: 7 })

  // Fetch all batches as backup
  const { data: allBatchesData, isLoading: allBatchesLoading } =
    api.inventory.getBatches.useQuery({
      status: "ACTIVE",
      limit: 200,
      offset: 0,
    })

  // Sort by expiration date (earliest first) - FEFO methodology
  const sortedBatches = useMemo(() => {
    const expiringBatches = expiringData ?? []
    return [...expiringBatches].sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    )
  }, [expiringData])

  // Calculate urgency metrics
  const metrics = useMemo(() => {
    const today = new Date()
    const critical = sortedBatches.filter(
      (b) => differenceInDays(new Date(b.expiresAt), today) <= 1
    ).length
    const warning = sortedBatches.filter((b) => {
      const days = differenceInDays(new Date(b.expiresAt), today)
      return days > 1 && days <= 3
    }).length
    const caution = sortedBatches.filter((b) => {
      const days = differenceInDays(new Date(b.expiresAt), today)
      return days > 3 && days <= 7
    }).length

    return { critical, warning, caution, total: sortedBatches.length }
  }, [sortedBatches])

  const allBatches = allBatchesData?.batches ?? []
  const isLoading = expiringLoading || allBatchesLoading

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Inventario FEFO - Productos para Acción Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Cargando inventario...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sortedBatches.length === 0) {
    return (
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Inventario FEFO - Productos para Acción Hoy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-center">
              ✅ Excelente estado. No hay productos próximos a expirar en los próximos 7 días.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Total de productos activos: {allBatches.length}
            </p>
          </div>
        </CardContent>
      </Card>
    )
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
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  ⚠️ CRÍTICO (Hoy)
                </p>
                <p className="text-3xl font-bold text-destructive">
                  {metrics.critical}
                </p>
              </div>
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  ⏰ URGENTE (1-3 días)
                </p>
                <p className="text-3xl font-bold text-warning">
                  {metrics.warning}
                </p>
              </div>
              <Clock className="h-5 w-5 text-warning flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* Caution */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  📋 PLAN (3-7 días)
                </p>
                <p className="text-3xl font-bold text-primary">
                  {metrics.caution}
                </p>
              </div>
              <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-border/50 bg-linear-to-br from-card to-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Productos que Requieren Acción ({metrics.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left px-3 py-3 font-semibold text-foreground">
                    Producto
                  </th>
                  <th className="text-right px-3 py-3 font-semibold text-foreground">
                    Cantidad
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-foreground">
                    Lote
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground">
                    Vence
                  </th>
                  <th className="text-center px-3 py-3 font-semibold text-foreground">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedBatches.map((batch) => {
                  const today = new Date()
                  const daysLeft = differenceInDays(
                    new Date(batch.expiresAt),
                    today
                  )

                  let urgency: "critical" | "warning" | "caution" = "caution"
                  if (daysLeft <= 1) urgency = "critical"
                  else if (daysLeft <= 3) urgency = "warning"

                  const urgencyConfig = {
                    critical: {
                      bgColor: "bg-destructive/10",
                      borderColor: "border-l-4 border-l-destructive",
                      badgeVariant: "destructive" as const,
                      label: "Hhoje",
                      description: "Mueve al frente - VENCE HOY",
                    },
                    warning: {
                      bgColor: "bg-warning/10",
                      borderColor: "border-l-4 border-l-warning",
                      badgeVariant: "default" as const,
                      label: `${daysLeft}d`,
                      description: "Próximo a expirar - Prioriza",
                    },
                    caution: {
                      bgColor: "bg-primary/5",
                      borderColor: "border-l-4 border-l-primary",
                      badgeVariant: "default" as const,
                      label: `${daysLeft}d`,
                      description: "Planifica rotación",
                    },
                  }

                  const config = urgencyConfig[urgency]

                  return (
                    <tr
                      key={batch.id}
                      className={`${config.bgColor} ${config.borderColor} hover:bg-muted/40 transition-colors`}
                    >
                      {/* Product Info */}
                      <td className="px-3 py-4">
                        <div>
                          <p className="font-bold text-foreground">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                              {(batch as any).product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                              {(batch as any).product.sku}
                          </p>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="px-3 py-4 text-right font-mono font-bold text-foreground">
                        {batch.quantity.toLocaleString()}
                      </td>

                      {/* Batch Number */}
                      <td className="px-3 py-4">
                        <Badge variant="outline" className="text-xs font-mono">
                          {batch.batchNumber}
                        </Badge>
                      </td>

                      {/* Expiration Date */}
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={config.badgeVariant}>
                            {config.label}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(batch.expiresAt), "dd MMM", {
                              locale: es,
                            })}
                          </p>
                        </div>
                      </td>

                      {/* Action Label */}
                      <td className="px-3 py-4 text-center">
                        <p className="text-xs font-semibold text-foreground max-w-[100px] mx-auto">
                          {config.description}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="mt-6 pt-4 border-t border-border/20">
            <p className="text-xs font-semibold text-foreground mb-3">
              📌 Metodología FEFO (First-Expired, First-Out):
            </p>
            <ul className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li>✓ Siempre mueve productos más próximos a expirar al frente</li>
              <li>✓ Vende lo más antiguo primero para evitar merma</li>
              <li>✓ Revisa esta tabla cada turno para coordinar acciones</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
