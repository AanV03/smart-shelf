import { getServerAuthSession } from "@/server/auth"
import { redirect } from "next/navigation"
import { FefoInventoryTable } from "../_components/FefoInventoryTable"
import { StrategicInventoryTable } from "../_components/StrategicInventoryTable"
import { Eye, BarChart3 } from "lucide-react"

export const metadata = {
  title: "Inventario - Smart-Shelf",
  description: "Gestión de inventario FEFO",
}

export default async function InventoryPage() {
  const session = await getServerAuthSession()

  if (!session) {
    redirect("/api/auth/signin")
  }

  const isManager = session.user.role === "MANAGER"

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-secondary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              {isManager ? (
                <BarChart3 className="h-6 w-6 text-primary" />
              ) : (
                <Eye className="h-6 w-6 text-primary" />
              )}
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                {isManager ? "Inventario Estratégico" : "Inventario FEFO"}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              {isManager
                ? "Análisis de valor, retención y riesgo financiero. Toma decisiones basadas en datos."
                : "Productos que necesitan acción hoy según metodología FEFO (First-Expired, First-Out)."}
            </p>
          </div>

          {/* Role-specific content */}
          {isManager ? (
            <StrategicInventoryTable />
          ) : (
            <FefoInventoryTable />
          )}

          {/* Educational banner */}
          <div className="mt-8 rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-foreground mb-3">
              {isManager ? "💡 Gestión Estratégica" : "📚 Metodología FEFO"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isManager
                ? "Este módulo te muestra el valor total del inventario, qué productos están cerca de expirar y representan mayor riesgo financiero. Usa esta información para coordinar promociones, descuentos o donaciones antes de que los productos se pierdan."
                : "FEFO (First-Expired, First-Out) es la metodología correcta para productos perecederos. Siempre vende primero los productos más próximos a expirar. Esta vista te muestra exactamente qué productos deben ir al frente del estante hoy."}
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
