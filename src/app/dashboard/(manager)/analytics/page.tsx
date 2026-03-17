import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "../_components/AnalyticsPanel";
import { AnalyticsHeader } from "../_components/AnalyticsHeader";

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
          <AnalyticsHeader />

          {/* Analytics Content */}
          <AnalyticsPanel />
        </main>
      </div>
    </div>
  );
}
