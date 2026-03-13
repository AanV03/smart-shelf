"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    User,
    Mail,
    Shield,
    Store,
    CheckCircle2
} from "lucide-react";

export default function ProfilePage() {
    const { data: session, status } = useSession();

    // Redirect if not authenticated
    if (status === "loading") {
        return (
            <div className="w-full min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Cargando perfil...</p>
            </div>
        );
    }

    if (!session) {
        redirect("/auth/login");
    }

    const user = session.user;
    const userRole = user.stores?.[0]?.role ?? "EMPLOYEE";
    const userStore = user.stores?.[0];

    const getRoleDisplay = (role: string) => {
        const roleLabels = {
            MANAGER: "Gerente de Tienda",
            EMPLOYEE: "Empleado"
        };
        return roleLabels[role as keyof typeof roleLabels] ?? role;
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "MANAGER":
                return "default";
            case "EMPLOYEE":
                return "secondary";
            default:
                return "outline";
        }
    };

    return (
        <div className="w-full min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">
                {/* Header */}
                <div className="space-y-1 mb-6 lg:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                        Mi Perfil
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground hidden sm:block">
                        Visualiza tu información personal y configuración de cuenta
                    </p>
                </div>

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                    {/* Profile Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="px-4 sm:px-6">
                            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                            {/* Avatar Section */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                                <Avatar className="h-24 w-24 sm:h-24 sm:w-24">
                                    <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-emerald-400 text-white text-xl sm:text-2xl font-semibold">
                                        {user.name?.split(" ").map(n => n[0]).join("") ?? "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-center sm:text-left w-full">
                                    <h3 className="text-lg sm:text-xl font-semibold break-words">
                                        {user.name ?? "Usuario"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1 break-all">
                                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </p>
                                    <div className="flex justify-center sm:justify-start">
                                        <Badge variant={getRoleBadgeVariant(userRole)}>
                                            <Shield className="mr-1 h-3 w-3" />
                                            {getRoleDisplay(userRole)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Basic Information */}
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        Nombre Completo
                                    </Label>
                                    <p className="font-medium text-sm sm:text-base break-words">
                                        {user.name ?? "No especificado"}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        Correo Electrónico
                                    </Label>
                                    <p className="font-medium text-sm sm:text-base flex items-center gap-2 break-all">
                                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        <span className="truncate">{user.email}</span>
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        Rol en el Sistema
                                    </Label>
                                    <p className="font-medium text-sm sm:text-base">
                                        {getRoleDisplay(userRole)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        Tienda Asignada
                                    </Label>
                                    <p className="font-medium text-sm sm:text-base flex items-center gap-2">
                                        <Store className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                                        {userStore ? userStore.name : "Sin asignar"}
                                    </p>
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-xs sm:text-sm font-medium text-muted-foreground">
                                        ID de Usuario
                                    </Label>
                                    <p className="font-mono text-xs sm:text-sm text-muted-foreground break-all">
                                        {user.id}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Additional Info Sidebar */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Account Status */}
                        <Card>
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Estado de Cuenta
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Estado</span>
                                    <Badge variant="default" className="text-xs">
                                        Activo
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Sesión</span>
                                    <div className="flex items-center gap-1">
                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                        <span className="text-xs sm:text-sm font-medium">Conectado</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Proveedor</span>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {session?.user?.email?.includes("@") ? "Credenciales" : "OAuth"}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Auth Info Card */}
                        <Card>
                            <CardHeader className="px-4 sm:px-6">
                                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                    Autenticación
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 px-4 sm:px-6">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Protocolo</span>
                                    <Badge variant="outline" className="text-xs">
                                        JWT
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">Seguridad</span>
                                    <Badge variant="default" className="text-xs">
                                        HttpOnly
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground italic mt-2">
                                    La sesión se mantiene durante 30 días de inactividad
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
