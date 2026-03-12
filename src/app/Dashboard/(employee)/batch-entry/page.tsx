import { getServerAuthSession } from "@/server/auth"
import { notFound } from "next/navigation"
import { BatchEntryForm } from "../_components/BatchEntryForm"
import { RecentBatches } from "../_components/RecentBatches"
import { Zap } from "lucide-react"

export const metadata = {
  title: "Batch Entry - Smart-Shelf",
  description: "Ingreso rápido de lotes de inventario",
}

export default async function BatchEntryPage() {
  const session = await getServerAuthSession()

  if (session?.user.role !== "EMPLOYEE") {
    notFound()
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Animated gradient background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-secondary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-40" />
      </div>

      <div className="relative z-10">
        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          {/* Hero section */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-6 w-6 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Ingreso de Lotes
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Registra nuevos lotes con rapidez. Optimizado para teclado y lector de códigos.
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
          <div className="mt-8 rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-6">
            <h3 className="text-sm font-bold text-foreground mb-3">💡 Consejos para máxima velocidad:</h3>
            <ul className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li>✓ Usa <kbd className="bg-muted px-1 rounded text-xs">Tab</kbd> para navegar rápido</li>
              <li>✓ Escanea el número de lote directamente del código de barras</li>
              <li>✓ Los números de lote se validan automáticamente</li>
              <li>✓ El formulario se limpia después de cada entrada</li>
              <li>✓ Mira el historial en tiempo real mientras ingresas</li>
              <li>✓ Usa <kbd className="bg-muted px-1 rounded text-xs">Enter</kbd> para confirmar rápido</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}
