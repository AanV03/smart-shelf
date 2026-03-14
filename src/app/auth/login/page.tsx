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
    const activeStores =
      session.user.stores?.filter(
        (s) => s.status === "ACTIVE" && s.role !== "PENDING",
      ) ?? [];

    if (activeStores.length > 0) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Animated Background Gradients */}
      <div className="from-background via-background to-background absolute inset-0 -z-10 bg-linear-to-br">
        {/* Blob 1 - Primary */}
        <div className="bg-primary/15 animate-blob pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter"></div>

        {/* Blob 2 - Secondary */}
        <div className="bg-secondary/15 animate-blob animation-delay-2000 pointer-events-none absolute top-1/3 -right-32 h-96 w-96 rounded-full opacity-40 mix-blend-multiply blur-3xl filter"></div>

        {/* Blob 3 - Primary again */}
        <div className="bg-primary/10 animate-blob animation-delay-4000 pointer-events-none absolute -bottom-40 left-1/3 h-96 w-96 rounded-full opacity-30 mix-blend-multiply blur-3xl filter"></div>

        {/* Ambient Light Effect */}
        <div className="bg-gradient-radial to-background absolute inset-0 from-transparent via-transparent opacity-50"></div>
      </div>

      {/* Content Container */}
      <div className="relative w-full max-w-md">
        {/* Header Animation */}
        <div className="animate-fade-in mb-12 text-center">
          <h1 className="from-primary via-primary to-secondary mb-3 bg-linear-to-r bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
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
        <div className="text-muted-foreground animate-fade-in mt-8 text-center text-sm">
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
