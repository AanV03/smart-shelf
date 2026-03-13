"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export function CreateStoreForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createStoreMutation = api.stores.createStore.useMutation({
    onSuccess: (data) => {
      console.log("[CreateStoreForm] Success:", data);
      // Redirect to dashboard after successful creation
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("[CreateStoreForm] Error:", error);
      setError(error.message || "Error creating store");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("El nombre de la tienda es requerido");
      return;
    }

    createStoreMutation.mutate({
      name: name.trim(),
      location: location.trim() || undefined,
    });
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Crea tu Tienda
        </h2>
        <p className="text-sm text-muted-foreground">
          Serás el administrador de esta tienda una vez creada.
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
          <Label htmlFor="store-name" className="text-sm font-medium">
            Nombre de la Tienda *
          </Label>
          <Input
            id="store-name"
            type="text"
            placeholder="Ej: Mi Tienda Principal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={createStoreMutation.isPending}
            required
            aria-required="true"
            aria-describedby={error ? "store-error" : undefined}
            className="bg-input border-border focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-location" className="text-sm font-medium">
            Ubicación (Opcional)
          </Label>
          <Input
            id="store-location"
            type="text"
            placeholder="Ej: Calle Principal 123, Ciudad"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={createStoreMutation.isPending}
            className="bg-input border-border focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>

        <Button
          type="submit"
          disabled={createStoreMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {createStoreMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Creando...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              Crear Tienda
            </>
          )}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Los campos marcados con * son obligatorios
      </p>
    </div>
  );
}
