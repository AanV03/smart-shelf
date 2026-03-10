import ManagerDashboard from "@/components/smart-shelf/ManagerDashboard";
import EmployeeDashboard from "@/components/smart-shelf/EmployeeDashboard";
import { getServerAuthSession } from "@/server/auth"; // Magia de T3
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    // 1. Vemos quién inició sesión
    const session = await getServerAuthSession();

    // 2. Si no hay nadie, lo pateamos al login
    if (!session) return redirect("/api/auth/signin");

    // 3. Renderizamos el componente correcto según su rol
    if (session.user.role === "MANAGER") {
        return <ManagerDashboard />;
    }

    if (session.user.role === "EMPLOYEE") {
        return <EmployeeDashboard />;
    }
}