"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isValidEmail = (email: string) => {
    return /^([^\s@]+)@([^\s@]+)$/i.test(email);
  };

  const isValidPassword = (pwd: string) => pwd.length >= 6;

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const formValid = emailValid && passwordValid && !isLoading;

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
    <form onSubmit={handleCredentialsLogin} className="w-full space-y-6 animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg backdrop-blur-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Error al iniciar sesión</p>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground">
            Correo electrónico
          </Label>
          {touched.email && emailValid && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched({ ...touched, email: true })}
            required
            className="pl-10 h-11 bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
            aria-invalid={touched.email && !emailValid}
            aria-describedby={touched.email && !emailValid ? "email-error" : undefined}
          />
        </div>
        {touched.email && !emailValid && email && (
          <p id="email-error" className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Email inválido
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Contraseña
          </Label>
          {touched.password && passwordValid && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, password: true })}
            required
            minLength={6}
            className="pl-10 pr-11 h-11 bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
            aria-invalid={touched.password && !passwordValid}
            aria-describedby={touched.password && !passwordValid ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {touched.password && !passwordValid && password && (
          <p id="password-error" className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Mínimo 6 caracteres
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!formValid}
        className="w-full h-11 mt-8 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </button>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Regístrate aquí
          </button>
        </p>
      )}
    </form>
  );
}
