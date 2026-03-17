import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { StoreSettings } from "../_components/StoreSettings";

export default async function SettingsPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Check if user is ADMIN
  const isAdmin = session.user.stores?.some((s) => s.role === "ADMIN");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <StoreSettings />
    </div>
  );
}
