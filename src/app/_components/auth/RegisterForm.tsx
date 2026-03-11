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
      <div className="w-full max-w-md mx-auto relative">
        <div className="relative bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl">
          {/* Decorative gradient background */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

          <div className="flex flex-col items-center gap-4 text-center relative z-10">
            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                ¡Registro exitoso!
              </h2>
              <p className="text-sm text-muted-foreground">
                Tu cuenta ha sido creada. Iniciando sesión...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      <div className="relative bg-white/[0.08] backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6 shadow-2xl">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Título */}
      <div className="space-y-2 text-center relative z-10">
        <div className="flex items-center justify-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Smart-Shelf
          </h1>
        </div>
        <p className="text-base text-muted-foreground font-medium">
          Crea una nueva cuenta
        </p>
      </div>

      {/* Error Alert - mejorado */}
      {error && (
        <div
          className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg animate-pulse-slow backdrop-blur-sm"
          role="alert"
          aria-live="polite"
          aria-label="Error"
        >
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </div>
      )}

      {/* Register Form */}
      <form onSubmit={handleRegister} className="space-y-4 relative z-10">
        {/* Name Field */}
        <div className="space-y-2">
          <Label
            htmlFor="name"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            Nombre Completo
            {touched.name && nameValid && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </Label>
          <div className="relative group">
            <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched({ ...touched, name: true })}
              required
              aria-required="true"
              aria-invalid={touched.name && !nameValid}
              aria-describedby="name-error"
              className="pl-12 bg-input/50 backdrop-blur-sm border-white/10 focus:border-primary/50 focus:bg-input/80 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            {touched.name && !nameValid && name && (
              <p
                id="name-error"
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" /> Mínimo 2 caracteres
              </p>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            Correo electrónico
            {touched.email && emailValid && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched({ ...touched, email: true })}
              required
              aria-required="true"
              aria-invalid={touched.email && !emailValid}
              aria-describedby="email-error"
              className="pl-12 bg-input/50 backdrop-blur-sm border-white/10 focus:border-primary/50 focus:bg-input/80 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            {touched.email && !emailValid && email && (
              <p
                id="email-error"
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" /> Email inválido
              </p>
            )}
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            Contraseña
            {touched.password && passwordValid && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, password: true })}
              required
              aria-required="true"
              aria-invalid={touched.password && !passwordValid}
              aria-describedby="password-error"
              minLength={6}
              className="pl-12 pr-12 bg-input/50 backdrop-blur-sm border-white/10 focus:border-primary/50 focus:bg-input/80 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-1 transition-colors"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={0}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {touched.password && !passwordValid && password && (
              <p
                id="password-error"
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" /> Mínimo 6 caracteres
              </p>
            )}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-semibold text-foreground flex items-center gap-2"
          >
            Confirmar Contraseña
            {touched.confirmPassword && confirmPasswordValid && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched({ ...touched, confirmPassword: true })}
              required
              aria-required="true"
              aria-invalid={touched.confirmPassword && !confirmPasswordValid}
              aria-describedby="confirmPassword-error"
              minLength={6}
              className="pl-12 pr-12 bg-input/50 backdrop-blur-sm border-white/10 focus:border-primary/50 focus:bg-input/80 focus:ring-2 focus:ring-primary/20 transition-all"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-1 transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Ocultar confirmación"
                  : "Mostrar confirmación"
              }
              tabIndex={0}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
            {touched.confirmPassword && !confirmPasswordValid && confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-xs text-destructive mt-1 flex items-center gap-1"
              >
                <AlertCircle className="h-3 w-3" /> Las contraseñas no coinciden
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-70 mt-6"
          disabled={!formValid}
          aria-label="Crear nueva cuenta"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Registrando..." : "Crear Cuenta"}
        </Button>
      </form>

      {/* Separator - mejorado */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gradient-to-r from-card via-card to-card px-3 text-muted-foreground font-medium">
            O regístrate con
          </span>
        </div>
      </div>

      {/* OAuth Buttons - mejorados */}
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            signIn("discord", {
              redirect: true,
              callbackUrl: "/dashboard",
            })
          }
          disabled={isLoading}
          aria-label="Registrarse con Discord"
          className="h-10 border-white/10 hover:bg-white/5 hover:border-white/20 transition-all backdrop-blur-sm"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20.317 4.3671a19.8 19.8 0 00-4.885-1.515.074.074 0 00-.079.036c-.21.375-.444.864-.607 1.25a18.27 18.27 0 00-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 00-.079-.036A19.892 19.892 0 003.692 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.637.873-1.31 1.226-2.01a.077.077 0 00-.042-.107 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.294.075.075 0 01.078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 01.079.009c.12.098.246.198.373.294a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.372 1.225 2.01a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-4.506.8-8.9.111-13.23a.056.056 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-.967-2.157-2.156 0-1.193.979-2.163 2.157-2.163 1.183 0 2.157.97 2.157 2.163 0 1.19-.974 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.967-2.157-2.156 0-1.193.979-2.163 2.157-2.163 1.183 0 2.157.97 2.157 2.163 0 1.19-.974 2.156-2.157 2.156z" />
          </svg>
          <span className="hidden sm:inline">Discord</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            signIn("google", {
              redirect: true,
              callbackUrl: "/dashboard",
            })
          }
          disabled={isLoading}
          aria-label="Registrarse con Google"
          className="h-10 border-white/10 hover:bg-white/5 hover:border-white/20 transition-all backdrop-blur-sm"
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
          <span className="hidden sm:inline">Google</span>
        </Button>
      </div>

      {/* Login Link */}
      <div className="text-center text-sm relative z-10">
        <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
        <button
          onClick={onSwitchToLogin}
          className="font-semibold text-primary hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-1 transition-colors"
        >
          Inicia sesión aquí
        </button>
      </div>
      </div>
    </div>
  );
}
