"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok) {
        setError("Email o contraseña incorrectos");
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      setError("Error al iniciar sesión. Intenta más tarde.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: "discord" | "google") => {
    setError("");
    try {
      await signIn(provider, { redirect: true, callbackUrl: "/dashboard" });
    } catch (err) {
      setError(`Error al iniciar sesión con ${provider}.`);
      console.error(`${provider} login error:`, err);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-6">
      {/* Título */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-foreground">Smart-Shelf</h1>
        <p className="text-sm text-muted-foreground">
          Inicia sesión en tu cuenta
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
          role="alert"
          aria-label="Error"
        >
          <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-required="true"
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-label="Iniciar sesión con email y contraseña"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>

      {/* Separator */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("discord")}
          disabled={isLoading}
          aria-label="Iniciar sesión con Discord"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20.317 4.3671a19.8 19.8 0 00-4.885-1.515.074.074 0 00-.079.036c-.21.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 00-.079-.036A19.892 19.892 0 003.692 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.637.873-1.31 1.226-2.01a.077.077 0 00-.042-.107 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 01.079.009c.12.098.246.198.373.294a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.372 1.225 2.01a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-4.506.8-8.9.111-13.23a.056.056 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-.967-2.157-2.156 0-1.193.979-2.163 2.157-2.163 1.183 0 2.157.97 2.157 2.163 0 1.19-.974 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.967-2.157-2.156 0-1.193.979-2.163 2.157-2.163 1.183 0 2.157.97 2.157 2.163 0 1.19-.974 2.156-2.157 2.156z" />
          </svg>
          Discord
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => handleOAuthLogin("google")}
          disabled={isLoading}
          aria-label="Iniciar sesión con Google"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </Button>
      </div>

      {/* Register Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿No tienes cuenta? </span>
        <button
          onClick={onSwitchToRegister}
          className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Regístrate aquí
        </button>
      </div>
    </Card>
  );
}
