"use client";

import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/_components/auth/LoginForm";
import { RegisterForm } from "@/app/_components/auth/RegisterForm";
import { RegisterOAuthSection } from "@/app/_components/auth/RegisterOAuthSection";

type AuthMode = "login" | "register";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";
const FAVICON_URL = `${SITE_URL}/favicon.png`;

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
    <div
      className="relative flex flex-col min-h-screen items-center justify-start overflow-auto py-4 sm:py-6 px-2 sm:px-3"
      style={{
        background: "var(--gradient-auth-bg)",
      }}
    >
      {/* Content Container */}
      {mode === "login" ? (
        // Login Form Layout (single column)
        <div className="relative w-full max-w-sm">
          {/* Header Animation */}
          <div className="animate-fade-in flex justify-center items-center gap-2.5 sm:gap-3">
            <Image
              src={FAVICON_URL}
              alt="Smart-Shelf Logo"
              width={40}
              height={40}
              priority
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <h1 className="text-foreground text-xl sm:text-2xl font-bold">
              Smart<span className="text-muted-foreground">Shelf</span>
            </h1>
          </div>

          {/* Form Container with glassmorphism */}
          <div className="transition-all duration-300 backdrop-blur-md rounded-2xl p-4 sm:p-6 mt-4 sm:mt-6" style={{ backgroundColor: "var(--color-glass-bg)", borderColor: "var(--color-glass-border)", borderWidth: "1px" }}>
            <LoginForm onSwitchToRegister={() => setMode("register")} />
          </div>
        </div>

      ) : (
        // Register Form Layout (responsive grid)
        <div className="relative w-full max-w-2xl">
          {/* Header Animation */}
          <div className="animate-fade-in flex justify-center items-center gap-2.5 sm:gap-3">
            <Image
              src={FAVICON_URL}
              alt="Smart-Shelf Logo"
              width={40}
              height={40}
              priority
              className="h-8 w-8 sm:h-10 sm:w-10"
            />
            <h1 className="text-foreground text-xl sm:text-2xl font-bold">
              Smart<span className="text-muted-foreground">Shelf</span>
            </h1>
          </div>

          {/* Form Container - Grid Layout with glassmorphism */}
          <div className="transition-all duration-300 grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-4 backdrop-blur-md rounded-2xl p-2.5 sm:p-4 relative mt-4 sm:mt-6" style={{ backgroundColor: "var(--color-glass-bg)", borderColor: "var(--color-glass-border)", borderWidth: "1px" }}>
            {/* Register Form Column */}
            <div className="md:col-span-1">
              <RegisterForm onSwitchToLogin={() => setMode("login")} hideOAuthSection={true} />
            </div>

            {/* Vertical Divider (hidden on mobile) */}
            <div className="hidden lg:block absolute inset-y-2.5 sm:inset-y-4 left-1/2 w-px bg-white/10 -translate-x-1/2"></div>

            {/* OAuth Section Column (hidden on mobile) */}
            <div className="hidden lg:flex lg:col-span-1">
              <RegisterOAuthSection />
            </div>

            {/* OAuth Section for Mobile (below form) */}
            <div className="lg:hidden">
              <RegisterForm onSwitchToLogin={() => setMode("login")} hideOAuthSection={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
