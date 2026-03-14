"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoreSettingsData {
  name: string;
  location: string;
  phone?: string;
  email?: string;
}

export function StoreSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<StoreSettingsData>({
    name: "",
    location: "",
    phone: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activeStore = session?.user?.stores?.[0];

  useEffect(() => {
    if (activeStore) {
      setSettings({
        name: activeStore.name || "",
        location: "",
        phone: "",
        email: "",
      });
    }
  }, [activeStore]);

  const handleInputChange = (field: keyof StoreSettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/stores/${activeStore.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json() as { message: string };
        throw new Error(data.message);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      console.log("[SETTINGS_SAVED]", settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al guardar";
      setError(message);
      console.error("[SETTINGS_ERROR]", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configuración de la Tienda
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra la información de tu tienda
        </p>
      </div>

      {/* Store Info Card */}
      <Card className="border-slate-700 bg-white/5 backdrop-blur-md p-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-300">Configuración guardada correctamente</span>
            </Alert>
          )}

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="store-name" className="text-foreground">
              Nombre de la Tienda
            </Label>
            <Input
              id="store-name"
              value={settings.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-foreground
                        focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: La Esperanza"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">
              Ubicación
            </Label>
            <Input
              id="location"
              value={settings.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-foreground
                        focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: Avenida Principal 123"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              Teléfono
            </Label>
            <Input
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-foreground
                        focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: +34 912 345 678"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email de Contacto
            </Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="bg-slate-900/50 border-slate-700 text-foreground
                        focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: contacto@laesperanza.com"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white
                      flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 backdrop-blur-md p-6">
        <h3 className="text-lg font-semibold text-destructive mb-3">
          Zona de Peligro
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Acciones irreversibles que afectarán tu tienda
        </p>
        <Button
          variant="destructive"
          className="w-full"
          disabled
        >
          Eliminar Tienda (Próximamente)
        </Button>
      </Card>
    </div>
  );
}
