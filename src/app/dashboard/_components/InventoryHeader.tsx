"use client";

import { BarChart3, Eye } from "lucide-react";
import { useI18n } from "@/lib/i18n-client";

interface InventoryHeaderProps {
  isManager: boolean;
}

export function InventoryHeader({ isManager }: InventoryHeaderProps) {
  const { t } = useI18n();

  return (
    <>
      {/* Hero section */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          {isManager ? (
            <BarChart3 className="text-primary h-6 w-6" />
          ) : (
            <Eye className="text-primary h-6 w-6" />
          )}
          <h1 className="text-foreground text-4xl font-bold tracking-tight">
            {isManager
              ? t.inventory.strategicTitle
              : t.inventory.fefoTitle}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {isManager
            ? t.inventory.strategicSubtitle
            : t.inventory.fefoSubtitle}
        </p>
      </div>

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
    </>
  );
}
