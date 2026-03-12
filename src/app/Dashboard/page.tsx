import ManagerDashboard from "@/app/_components/ManagerDashboard/ManagerDashboard";
import EmployeeDashboard from "@/app/_components/EmployeeDashboard/EmployeeDashboard";
import { getServerAuthSession } from "@/server/auth"; // Magia de T3
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    // 1. Vemos quién inició sesión
    const session = await getServerAuthSession();

    // 2. Si no hay nadie, lo pateamos al login
    if (!session) return redirect("/api/auth/signin");

    // 3. Renderizamos el componente correcto según su rol
    return session.user.role === "MANAGER" ? <ManagerDashboard /> : <EmployeeDashboard />;
}