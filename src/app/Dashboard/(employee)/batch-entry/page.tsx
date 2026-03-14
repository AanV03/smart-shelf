import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";
import { BatchEntryForm } from "../_components/BatchEntryForm";
import { RecentBatches } from "../_components/RecentBatches";
import { Zap } from "lucide-react";

export const metadata = {
  title: "Batch Entry - Smart-Shelf",
  description: "Ingreso rápido de lotes de inventario",
};

export default async function BatchEntryPage() {
  const session = await getServerAuthSession();

  if (!session) {
    notFound();
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="bg-primary/20 animate-blob absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-70 mix-blend-multiply blur-3xl filter" />
        <div className="bg-secondary/15 animate-blob animation-delay-2000 absolute right-0 -bottom-40 h-96 w-96 rounded-full opacity-50 mix-blend-multiply blur-3xl filter" />
        <div className="bg-primary/10 animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="text-primary h-6 w-6" />
              <h1 className="text-foreground text-4xl font-bold tracking-tight">
                Ingreso de Lotes
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Registra nuevos lotes con rapidez. Optimizado para teclado y
              lector de códigos.
            </p>
          </div>

          {/* Two-column layout: Form on left, Recent batches on right */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Form - takes 1 column on mobile, 2 on desktop */}
            <div className="lg:col-span-1">
              <BatchEntryForm />
            </div>

            {/* Recent batches - takes full width on mobile, 1 column on desktop */}
            <div className="lg:col-span-2">
              <RecentBatches />
            </div>
          </div>

          {/* Tips section */}
          <div className="border-border/30 bg-card/50 mt-8 rounded-lg border p-6 backdrop-blur-sm">
            <h3 className="text-foreground mb-3 text-sm font-bold">
              💡 Consejos para máxima velocidad:
            </h3>
            <ul className="text-muted-foreground grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <li>
                ✓ Usa <kbd className="bg-muted rounded px-1 text-xs">Tab</kbd>{" "}
                para navegar rápido
              </li>
              <li>
                ✓ Escanea el número de lote directamente del código de barras
              </li>
              <li>✓ Los números de lote se validan automáticamente</li>
              <li>✓ El formulario se limpia después de cada entrada</li>
              <li>✓ Mira el historial en tiempo real mientras ingresas</li>
              <li>
                ✓ Usa <kbd className="bg-muted rounded px-1 text-xs">Enter</kbd>{" "}
                para confirmar rápido
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
