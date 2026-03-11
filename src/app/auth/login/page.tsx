"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/app/_components/auth/LoginForm";
import { RegisterForm } from "@/app/_components/auth/RegisterForm";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const { status } = useSession();
  const [mode, setMode] = useState<AuthMode>("login");

  // If already logged in, redirect to dashboard
  if (status === "authenticated") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-50"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-50"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-50"></div>
      </div>

      {/* Main content */}
      <div className="w-full max-w-md">
        {mode === "login" ? (
          <LoginForm onSwitchToRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
