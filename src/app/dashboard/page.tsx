import ManagerDashboard from "@/app/_components/ManagerDashboard/ManagerDashboard";
import EmployeeDashboard from "@/app/_components/EmployeeDashboard/EmployeeDashboard";
import AdminDashboard from "@/app/_components/AdminDashboard/AdminDashboard";
import { getServerAuthSession } from "@/server/auth"; // Magia de T3
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // 1. Vemos quién inició sesión
  const session = await getServerAuthSession();

  // 2. Si no hay nadie, lo pateamos al login
  if (!session) return redirect("/auth/login");

  // 3. Renderizamos el componente correcto según su rol
  const userRole = session.user.stores?.[0]?.role;

  if (userRole === "ADMIN") {
    return <AdminDashboard />;
  }

  return userRole === "MANAGER" ? <ManagerDashboard /> : <EmployeeDashboard />;
}
