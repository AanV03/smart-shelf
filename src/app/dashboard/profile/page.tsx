"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Store, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-client";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { t } = useI18n();

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
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
      MANAGER: t.profile.storeManager,
      EMPLOYEE: t.profile.employee,
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
    <div className="min-h-screen w-full">
      <div className="container mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6 space-y-1 lg:mb-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
            {t.profile.title}
          </h1>
          <p className="text-muted-foreground hidden text-xs sm:block sm:text-sm md:text-base">
            {t.profile.subtitle}
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                {t.profile.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:space-y-6 sm:px-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                <Avatar className="h-24 w-24 sm:h-24 sm:w-24">
                  <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-emerald-400 text-xl font-semibold text-white sm:text-2xl">
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="w-full space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold break-words sm:text-xl">
                    {user.name ?? "Usuario"}
                  </h3>
                  <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm break-all sm:justify-start">
                    <Mail className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t.profile.fullName}
                  </Label>
                  <p className="text-sm font-medium break-words sm:text-base">
                    {user.name ?? t.profile.notSpecified}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t.profile.email}
                  </Label>
                  <p className="flex items-center gap-2 text-sm font-medium break-all sm:text-base">
                    <Mail className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">{user.email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t.profile.role}
                  </Label>
                  <p className="text-sm font-medium sm:text-base">
                    {getRoleDisplay(userRole)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t.profile.assignedStore}
                  </Label>
                  <p className="flex items-center gap-2 text-sm font-medium sm:text-base">
                    <Store className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                    {userStore ? userStore.name : t.profile.unassigned}
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground text-xs font-medium sm:text-sm">
                    {t.profile.userId}
                  </Label>
                  <p className="text-muted-foreground font-mono text-xs break-all sm:text-sm">
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
                  {t.profile.accountStatus}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:space-y-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {t.profile.status}
                  </span>
                  <Badge variant="default" className="text-xs">
                    {t.profile.active}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {t.profile.session}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium sm:text-sm">
                      {t.profile.connected}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {t.profile.provider}
                  </span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {session?.user?.email?.includes("@")
                      ? t.profile.credentials
                      : "OAuth"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Auth Info Card */}
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  {t.profile.authentication}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 px-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {t.profile.protocol}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    JWT
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {t.profile.security}
                  </span>
                  <Badge variant="default" className="text-xs">
                    HttpOnly
                  </Badge>
                </div>
                <div className="text-muted-foreground mt-2 text-xs italic">
                  {t.profile.sessionDuration}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
