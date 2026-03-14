import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { FefoInventoryTable } from "../_components/FefoInventoryTable";
import { StrategicInventoryTable } from "../_components/StrategicInventoryTable";
import { Eye, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Inventario - Smart-Shelf",
  description: "Gestión de inventario FEFO",
};

export default async function InventoryPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const isManager =
    session.user.stores?.[0]?.role === "MANAGER" ||
    session.user.stores?.[0]?.role === "ADMIN";

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-primary/20 animate-blob absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-70 mix-blend-multiply blur-3xl filter" />
        <div className="bg-secondary/15 animate-blob animation-delay-2000 absolute right-0 -bottom-40 h-96 w-96 rounded-full opacity-50 mix-blend-multiply blur-3xl filter" />
        <div className="bg-primary/10 animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-2">
              {isManager ? (
                <BarChart3 className="text-primary h-6 w-6" />
              ) : (
                <Eye className="text-primary h-6 w-6" />
              )}
              <h1 className="text-foreground text-4xl font-bold tracking-tight">
                {isManager ? "Inventario Estratégico" : "Inventario FEFO"}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {isManager
                ? "Análisis de valor, retención y riesgo financiero. Toma decisiones basadas en datos."
                : "Productos que necesitan acción hoy según metodología FEFO (First-Expired, First-Out)."}
            </p>
          </div>

          {/* Role-specific content */}
          {isManager ? <StrategicInventoryTable /> : <FefoInventoryTable />}

          {/* Educational banner */}
          <div className="border-border/30 bg-card/50 mt-8 rounded-lg border p-6 backdrop-blur-sm">
            <h3 className="text-foreground mb-3 text-sm font-bold">
              {isManager ? "💡 Gestión Estratégica" : "📚 Metodología FEFO"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {isManager
                ? "Este módulo te muestra el valor total del inventario, qué productos están cerca de expirar y representan mayor riesgo financiero. Usa esta información para coordinar promociones, descuentos o donaciones antes de que los productos se pierdan."
                : "FEFO (First-Expired, First-Out) es la metodología correcta para productos perecederos. Siempre vende primero los productos más próximos a expirar. Esta vista te muestra exactamente qué productos deben ir al frente del estante hoy."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
