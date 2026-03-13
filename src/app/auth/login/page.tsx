"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/_components/auth/LoginForm";
import { RegisterForm } from "@/app/_components/auth/RegisterForm";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { data: session, status } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");

  // ✅ LOGIC:
  // - If authenticated AND has active stores → redirect to dashboard
  // - If authenticated but NO active stores → redirect to onboarding
  // - If not authenticated → show login/register forms
  if (status === "authenticated" && session?.user) {
    const activeStores = session.user.stores?.filter(
      (s) => s.status === "ACTIVE" && s.role !== "PENDING"
    ) ?? [];

    if (activeStores.length > 0) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-background via-background to-background">
        {/* Blob 1 - Primary */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-40 pointer-events-none"></div>

        {/* Blob 2 - Secondary */}
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-secondary/15 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-40 pointer-events-none"></div>

        {/* Blob 3 - Primary again */}
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-30 pointer-events-none"></div>

        {/* Ambient Light Effect */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background opacity-50"></div>
      </div>

      {/* Content Container */}
      <div className="relative w-full max-w-md">
        {/* Header Animation */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-primary via-primary to-secondary bg-clip-text text-transparent mb-3">
            Smart-Shelf
          </h1>
          <p className="text-muted-foreground text-lg">
            {mode === "login"
              ? "Gestión inteligente de inventario"
              : "Únete a Smart-Shelf hoy"}
          </p>
        </div>

        {/* Form Container with transition */}
        <div className="transition-all duration-300">
          {mode === "login" ? (
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode("login")} />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in">
          <p>
            Mantén tu inventario{" "}
            <span className="text-primary font-semibold">organizado</span> y{" "}
            <span className="text-primary font-semibold">actualizado</span>
          </p>
        </div>
      </div>
    </div>
  );
}
