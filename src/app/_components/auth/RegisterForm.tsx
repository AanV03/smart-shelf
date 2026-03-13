"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validation helpers
  const isValidEmail = (email: string) => {
    return /^([^\s@]+)@([^\s@]+)$/i.test(email);
  };

  const isValidPassword = (pwd: string) => pwd.length >= 6;
  const isValidName = (name: string) => name.trim().length >= 2;
  const passwordsMatch = password === confirmPassword;

  const emailValid = isValidEmail(email);
  const passwordValid = isValidPassword(password);
  const confirmPasswordValid = passwordsMatch && password.length > 0;
  const nameValid = isValidName(name);
  const formValid =
    nameValid && emailValid && passwordValid && confirmPasswordValid && !isLoading;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!nameValid) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (!emailValid) {
      setError("Email inválido");
      return;
    }

    if (!passwordValid) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!confirmPasswordValid) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(data.message ?? "Error al registrar");
        return;
      }

      setSuccess(true);

      // Auto-login after successful registration
      setTimeout(() => {
        void (async () => {
          await signIn("credentials", {
            email,
            password,
            redirect: true,
            callbackUrl: "/dashboard",
          });
        })();
      }, 1500);
    } catch (err) {
      setError("Error al registrar. Intenta más tarde.");
      console.error("Register error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full space-y-6 animate-fade-in text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/15 p-4">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            ¡Registro exitoso!
          </h2>
          <p className="text-sm text-muted-foreground">
            Tu cuenta ha sido creada. Iniciando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="w-full space-y-6 animate-fade-in">
      {/* Error Alert */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg backdrop-blur-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Error al registrar</p>
            <p className="text-xs text-destructive/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="name" className="text-sm font-semibold text-foreground">
            Nombre Completo
          </Label>
          {touched.name && nameValid && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched({ ...touched, name: true })}
            required
            className="pl-10 h-11 bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
            aria-invalid={touched.name && !nameValid}
            aria-describedby={touched.name && !nameValid ? "name-error" : undefined}
          />
        </div>
        {touched.name && !nameValid && name && (
          <p id="name-error" className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Mínimo 2 caracteres
          </p>
        )}
      </div>

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

      {/* Confirm Password Field */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
            Confirmar Contraseña
          </Label>
          {touched.confirmPassword && confirmPasswordValid && (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          )}
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Repite tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, confirmPassword: true })}
            required
            minLength={6}
            className="pl-10 pr-11 h-11 bg-secondary/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
            aria-invalid={touched.confirmPassword && !confirmPasswordValid}
            aria-describedby={touched.confirmPassword && !confirmPasswordValid ? "confirmPassword-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {touched.confirmPassword && !confirmPasswordValid && confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
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
        {isLoading ? "Registrando..." : "Crear Cuenta"}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/30"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => signIn("google", { redirect: true, callbackUrl: "/dashboard" })}
          disabled={isLoading}
          className="h-11 bg-secondary/50 hover:bg-secondary border border-border/30 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Google</span>
        </button>

        <button
          type="button"
          onClick={() => signIn("discord", { redirect: true, callbackUrl: "/dashboard" })}
          disabled={isLoading}
          className="h-11 bg-secondary/50 hover:bg-secondary border border-border/30 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3702a19.8 19.8 0 0 0-4.885-1.515a.07.07 0 0 0-.079.0336c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.165-.386-.398-.875-.609-1.25a.07.07 0 0 0-.079-.0336A19.773 19.773 0 0 0 3.677 4.37a.07.07 0 0 0-.032.0277C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.1a13.114 13.114 0 0 1-1.872-.892a.072.072 0 0 1-.009-.119c.125-.093.25-.19.371-.287a.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.245.195.371.288a.072.072 0 0 1-.01.119a12.96 12.96 0 0 1-1.873.892a.07.07 0 0 0-.038.1a15 15 0 0 0 1.294 2.1a.07.07 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.083.083 0 0 0 .032-.056c.361-4.334-.635-8.793-2.685-12.794a.07.07 0 0 0-.032-.028zM8.359 15.864c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.2.977 2.182 2.181c0 1.203-.973 2.18-2.182 2.18zm7.294 0c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.198.977 2.182 2.181c0 1.203-.972 2.18-2.182 2.18z" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Discord</span>
        </button>
      </div>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <p className=" text-center text-sm text-muted-foreground mt-6">
          ¿Ya tienes cuenta?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            Inicia sesión aquí
          </button>
        </p>
      )}
    </form>
  );
}
