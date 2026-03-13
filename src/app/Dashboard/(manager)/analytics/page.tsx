import { getServerAuthSession } from "@/server/auth"
import { notFound } from "next/navigation"
import { AnalyticsPanel } from "../_components/AnalyticsPanel"
import { BarChart3 } from "lucide-react"

export const metadata = {
  title: "Analytics - Smart-Shelf",
  description: "Panel de análisis y reportes financieros",
}

export default async function AnalyticsPage() {
  const session = await getServerAuthSession()

  if (!session) {
    notFound()
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-destructive/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Analytics y Reportes
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Proyecciones financieras, métricas de merma y tendencias de inventario
            </p>
          </div>

          {/* Analytics Content */}
          <AnalyticsPanel />

          {/* Footer educational section */}
          <div className="mt-8 rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-foreground mb-3">
              🎯 Cómo Usar Este Panel
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="font-semibold text-foreground mb-1">Valor Total de Inventario</p>
                <p>Muestra el dinero retenido en inventario activo. Reduce este número para mejorar cash flow.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Tendencia de Expiración</p>
                <p>Gráfico de 30 días mostrando picos de expiración. Planifica promociones en esas fechas.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Distribución por Categoría</p>
                <p>Identifica qué categorías concentran mayor valor. Monitorea su rotación.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Alertas Críticas</p>
                <p>Acciones inmediatas requeridas. Revísalas regularmente para evitar pérdidas.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
