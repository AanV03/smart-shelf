import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { TeamManagement } from "../_components/TeamManagement";

export default async function TeamPage() {
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
      <TeamManagement />
    </div>
  );
}
