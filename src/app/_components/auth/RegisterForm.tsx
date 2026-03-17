"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
  hideOAuthSection?: boolean;
}

export function RegisterForm({ onSwitchToLogin, hideOAuthSection }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const passwordValid = hasMinLength && hasNumber && hasUppercase && hasSpecialChar;
  const allPasswordRulesComplete = passwordValid;

  // Validation helpers
  const isValidEmail = (email: string) => {
    return /^([^\s@]+)@([^\s@]+)$/i.test(email);
  };

  const isValidName = (name: string) => name.trim().length >= 2;

  const emailValid = isValidEmail(email);
  const nameValid = isValidName(name);
  const formValid =
    nameValid &&
    emailValid &&
    passwordValid &&
    !isLoading;

  const handleComingSoon = () => {
    alert("Esta opción estará disponible próximamente");
  };

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
      setError("La contraseña debe cumplir todos los requisitos");
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
      <div className="animate-fade-in w-full space-y-4 sm:space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-primary/15 rounded-full p-3 sm:p-4">
            <CheckCircle2 className="text-primary h-6 w-6 sm:h-8 sm:w-8" />
          </div>
        </div>
        <div>
          <h2 className="text-foreground mb-1 sm:mb-2 text-xl sm:text-2xl font-bold">
            ¡Registro exitoso!
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Tu cuenta ha sido creada. Iniciando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleRegister}
      className="animate-fade-in w-full space-y-2.5 sm:space-y-3.5"
    >
      {/* Error Alert */}
      {error && (
        <div
          className="bg-destructive/10 border-destructive/30 flex items-start gap-1.5 sm:gap-2.5 rounded-lg border p-2.5 sm:p-3 backdrop-blur-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="text-destructive mt-0.5 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <div>
            <p className="text-destructive text-xs sm:text-sm font-semibold">
              Error al registrar
            </p>
            <p className="text-destructive/80 mt-0.5 text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Name Field */}
      <div className="space-y-1.5 sm:space-y-2.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="name"
            className="text-foreground text-xs sm:text-sm font-semibold"
          >
            Nombre Completo
          </Label>
          {touched.name && nameValid && (
            <CheckCircle2 className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </div>
        <div className="relative">
          <User className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2" />
          <Input
            id="name"
            type="text"
            placeholder="Tu nombre completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched({ ...touched, name: true })}
            required
            className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 border pl-10 focus:ring-2"
            style={{
              backgroundColor: "var(--color-glass-input-bg)",
              borderColor: "var(--color-glass-input-border)",
              borderWidth: "1px"
            }}
            disabled={isLoading}
            aria-invalid={touched.name && !nameValid}
            aria-describedby={
              touched.name && !nameValid ? "name-error" : undefined
            }
          />
        </div>
        {touched.name && !nameValid && name && (
          <p
            id="name-error"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            <AlertCircle className="h-3 w-3" /> Mínimo 2 caracteres
          </p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-1.5 sm:space-y-2.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="email"
            className="text-foreground text-xs sm:text-sm font-semibold"
          >
            Correo electrónico
          </Label>
          {touched.email && emailValid && (
            <CheckCircle2 className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </div>
        <div className="relative">
          <Mail className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2" />
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched({ ...touched, email: true })}
            required
            className="text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 border pl-10 focus:ring-2"
            style={{
              backgroundColor: "var(--color-glass-input-bg)",
              borderColor: "var(--color-glass-input-border)",
              borderWidth: "1px"
            }}
            disabled={isLoading}
            aria-invalid={touched.email && !emailValid}
            aria-describedby={
              touched.email && !emailValid ? "email-error" : undefined
            }
          />
        </div>
        {touched.email && !emailValid && email && (
          <p
            id="email-error"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            <AlertCircle className="h-3 w-3" /> Email inválido
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5 sm:space-y-2.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className="text-foreground text-xs sm:text-sm font-semibold"
          >
            Contraseña
          </Label>
          {allPasswordRulesComplete && (
            <CheckCircle2 className="text-primary h-3 w-3 sm:h-4 sm:w-4" />
          )}
        </div>
        <div className="relative">
          <Lock className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 sm:h-5 sm:w-5 -translate-y-1/2" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched({ ...touched, password: true })}
            required
            minLength={8}
            className={`text-foreground placeholder:text-muted-foreground focus:ring-primary/20 h-11 border pr-11 pl-10 focus:ring-2 transition-colors ${
              allPasswordRulesComplete && touched.password
                ? "focus:border-primary border-primary/30"
                : "focus:border-primary"
            }`}
            style={{
              backgroundColor: "var(--color-glass-input-bg)",
              borderColor: allPasswordRulesComplete && touched.password ? undefined : "var(--color-glass-input-border)",
              borderWidth: "1px"
            }}
            disabled={isLoading}
            aria-invalid={touched.password && !passwordValid}
            aria-describedby={
              touched.password && !passwordValid ? "password-error" : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3.5 -translate-y-1/2 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>

        {/* Password Requirements Checklist */}
        {!allPasswordRulesComplete && touched.password && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasMinLength
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {hasMinLength ? (
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
              ) : (
                <div className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0 rounded-full border border-current" />
              )}
              <span>8+ caracteres</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasNumber
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {hasNumber ? (
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
              ) : (
                <div className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0 rounded-full border border-current" />
              )}
              <span>Un número</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasUppercase
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {hasUppercase ? (
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
              ) : (
                <div className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0 rounded-full border border-current" />
              )}
              <span>Una mayúscula</span>
            </div>
            <div
              className={`flex items-center gap-1.5 transition-colors ${
                hasSpecialChar
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {hasSpecialChar ? (
                <CheckCircle2 className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0" />
              ) : (
                <div className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 shrink-0 rounded-full border border-current" />
              )}
              <span>Un carácter especial</span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!formValid}
        className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground focus-visible:ring-primary focus-visible:ring-offset-background mt-5 sm:mt-7 flex h-10 sm:h-11 w-full items-center justify-center gap-2 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        {isLoading && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
        {isLoading ? "Registrando..." : "Crear Cuenta"}
      </button>

      {/* Divider */}
      {!hideOAuthSection && (
        <div className="relative my-3 sm:my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="border-border/30 w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="text-muted-foreground px-2 text-xs">
              O continúa con
            </span>
          </div>
        </div>
      )}

      {/* OAuth Buttons */}
      {!hideOAuthSection && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() =>
            signIn("google", { redirect: true, callbackUrl: "/dashboard" })
          }
          disabled={isLoading}
          className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background text-foreground flex h-10 sm:h-11 items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
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
          <span className="hidden text-xs sm:text-sm font-medium sm:inline">Google</span>
        </button>

        <button
          type="button"
          onClick={() =>
            signIn("discord", { redirect: true, callbackUrl: "/dashboard" })
          }
          disabled={isLoading}
          className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background text-foreground flex h-10 sm:h-11 items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.3702a19.8 19.8 0 0 0-4.885-1.515a.07.07 0 0 0-.079.0336c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.165-.386-.398-.875-.609-1.25a.07.07 0 0 0-.079-.0336A19.773 19.773 0 0 0 3.677 4.37a.07.07 0 0 0-.032.0277C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.1a13.114 13.114 0 0 1-1.872-.892a.072.072 0 0 1-.009-.119c.125-.093.25-.19.371-.287a.075.075 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.075.075 0 0 1 .079.009c.12.098.245.195.371.288a.072.072 0 0 1-.01.119a12.96 12.96 0 0 1-1.873.892a.07.07 0 0 0-.038.1a15 15 0 0 0 1.294 2.1a.07.07 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.083.083 0 0 0 .032-.056c.361-4.334-.635-8.793-2.685-12.794a.07.07 0 0 0-.032-.028zM8.359 15.864c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.2.977 2.182 2.181c0 1.203-.973 2.18-2.182 2.18zm7.294 0c-1.195 0-2.182-.977-2.182-2.18c0-1.204.973-2.181 2.182-2.181c1.21 0 2.198.977 2.182 2.181c0 1.203-.972 2.18-2.182 2.18z" />
          </svg>
          <span className="hidden text-xs sm:text-sm font-medium sm:inline">Discord</span>
        </button>

        <button
          type="button"
          onClick={handleComingSoon}
          disabled={isLoading}
          className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background text-foreground flex h-10 sm:h-11 items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24c6.3 0 9.9-5.1 9.9-9.9 0-.2 0-.4 0-.6 1.2-.9 2.3-2 3.1-3.3-.4.2-.9.3-1.5.4.5-.3 1.1-.8 1.4-1.4-.5.3-1 .5-1.6.7-.4-.5-1.1-.8-1.8-.8-1.4 0-2.5 1.1-2.5 2.5 0 .2 0 .4 0 .6-2 0-3.9-1.1-5.1-2.6-.2.4-.4.9-.4 1.4 0 .8.4 1.6 1.1 2.1-.4 0-.8-.1-1.2-.3 0 1.2.9 2.3 2 2.6-.2 0-.4.1-.6.1-.1 0-.3 0-.4 0 .3 1.1 1.2 1.9 2.3 1.9-1 .7-2.1 1.2-3.4 1.2H11c1.1.7 2.5 1.1 3.9 1.1z"/>
          </svg>
          <span className="hidden text-xs sm:text-sm font-medium sm:inline">Microsoft</span>
        </button>

        <button
          type="button"
          onClick={handleComingSoon}
          disabled={isLoading}
          className="bg-secondary/50 hover:bg-secondary hover:text-secondary-foreground border-border/30 focus-visible:ring-primary focus-visible:ring-offset-background text-foreground flex h-10 sm:h-11 items-center justify-center gap-2 rounded-lg border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span className="hidden text-xs sm:text-sm font-medium sm:inline">GitHub</span>
        </button>
        </div>
      )}

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <p className="text-muted-foreground mt-3 sm:mt-4 text-center text-xs sm:text-sm">
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
