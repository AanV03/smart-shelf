import { getServerAuthSession } from "@/server/auth";
import { notFound } from "next/navigation";
import { BatchEntryForm } from "../_components/BatchEntryForm";
import { RecentBatches } from "../_components/RecentBatches";
import { BatchEntryHeader } from "../_components/BatchEntryHeader";

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
          <BatchEntryHeader />

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
        </main>
      </div>
    </div>
  );
}
