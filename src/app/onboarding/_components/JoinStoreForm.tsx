"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, LogIn } from "lucide-react";

export function JoinStoreForm() {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const joinStoreMutation = api.stores.joinStoreWithInvitationCode.useMutation({
    onSuccess: (data) => {
      // Redirect to dashboard after successful join
      router.push("/dashboard");
    },
    onError: (error) => {
      setError(error.message || "Error al unirse a la tienda");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!invitationCode.trim()) {
      setError("El código de invitación es requerido");
      return;
    }

    joinStoreMutation.mutate({
      invitationCode: invitationCode.trim().toUpperCase(),
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Únete a una Tienda
        </h2>
        <p className="text-sm text-muted-foreground">
          Ingresa el código de invitación que te proporcionó el administrador.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invitation-code" className="text-sm font-medium">
            Código de Invitación *
          </Label>
          <Input
            id="invitation-code"
            type="text"
            placeholder="Ej: ABCDEF"
            value={invitationCode}
            onChange={(e) => setInvitationCode(e.target.value)}
            disabled={joinStoreMutation.isPending}
            required
            aria-required="true"
            aria-describedby={error ? "invite-error" : undefined}
            className="uppercase bg-input border-border focus-visible:ring-2 focus-visible:ring-primary"
            maxLength={10}
          />
        </div>

        <Button
          type="submit"
          disabled={joinStoreMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {joinStoreMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Verificando...
            </>
          ) : (
            <>
              <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
              Unirme a Tienda
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Si no tienes un código, pídele al administrador de la tienda
      </p>
    </div>
  );
}
