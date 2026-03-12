import { getServerAuthSession } from "@/server/auth"
import { notFound } from "next/navigation"

export const metadata = {
  title: "Analytics - Smart-Shelf",
  description: "Panel de análisis y reportes financieros",
}

export default async function AnalyticsPage() {
  const session = await getServerAuthSession()

  if (session?.user.role !== "MANAGER") {
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
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Analytics y Reportes
            </h1>
            <p className="text-lg text-muted-foreground">
              Proyecciones financieras, métricas de merma y tendencias
            </p>
          </div>

          {/* Placeholder: Analytics Dashboard will go here */}
          <div className="rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm p-8">
            <p className="text-muted-foreground">
              ✅ Panel de analytics en desarrollo...
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
