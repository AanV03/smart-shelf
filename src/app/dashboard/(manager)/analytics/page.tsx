import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "../_components/AnalyticsPanel";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Analytics - Smart-Shelf",
  description: "Panel de análisis y reportes financieros",
};

export default async function AnalyticsPage() {
  const session = await getServerAuthSession();

  if (!session) {
    notFound();
  }

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
            <div className="mb-2 flex items-center gap-2">
              <BarChart3 className="text-primary h-6 w-6" />
              <h1 className="text-foreground text-4xl font-bold tracking-tight">
                Analytics y Reportes
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Proyecciones financieras, métricas de merma y tendencias de
              inventario
            </p>
          </div>

          {/* Analytics Content */}
          <AnalyticsPanel />

          {/* Footer educational section */}
          <div className="border-border/30 bg-card/50 mt-8 rounded-lg border p-6 backdrop-blur-sm">
            <h3 className="text-foreground mb-3 text-sm font-bold">
              🎯 Cómo Usar Este Panel
            </h3>
            <div className="text-muted-foreground grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <p className="text-foreground mb-1 font-semibold">
                  Valor Total de Inventario
                </p>
                <p>
                  Muestra el dinero retenido en inventario activo. Reduce este
                  número para mejorar cash flow.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 font-semibold">
                  Tendencia de Expiración
                </p>
                <p>
                  Gráfico de 30 días mostrando picos de expiración. Planifica
                  promociones en esas fechas.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 font-semibold">
                  Distribución por Categoría
                </p>
                <p>
                  Identifica qué categorías concentran mayor valor. Monitorea su
                  rotación.
                </p>
              </div>
              <div>
                <p className="text-foreground mb-1 font-semibold">
                  Alertas Críticas
                </p>
                <p>
                  Acciones inmediatas requeridas. Revísalas regularmente para
                  evitar pérdidas.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
