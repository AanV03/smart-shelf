import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { PlansSelection } from "@/app/dashboard/(admin)/_components/PlansSelection";

export default async function PlansPage() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // Only ADMIN can access plans
  const isAdmin = session.user.stores?.some((s) => s.role === "ADMIN");

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      <PlansSelection />
    </div>
  );
}
