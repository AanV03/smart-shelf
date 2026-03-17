import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { FefoInventoryTable } from "../_components/FefoInventoryTable";
import { StrategicInventoryTable } from "../_components/StrategicInventoryTable";
import { InventoryHeader } from "../_components/InventoryHeader";

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
          <InventoryHeader isManager={isManager} />

          {/* Role-specific content */}
          {isManager ? <StrategicInventoryTable /> : <FefoInventoryTable />}
        </main>
      </div>
    </div>
  );
}
