"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Settings, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteStoreModal } from "./DeleteStoreModal";
import { useI18n } from "@/lib/i18n-client";

interface StoreSettingsData {
  name: string;
  location: string;
  phone?: string;
  email?: string;
}

export function StoreSettings() {
  const { data: session } = useSession();
  const { t } = useI18n();
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
        const data = (await response.json()) as { message: string };
        throw new Error(data.message);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      console.log("[SETTINGS_SAVED]", settings);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.settings.saveError;
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
        <h1 className="text-foreground flex items-center gap-2 text-3xl font-bold">
          <Settings className="h-8 w-8" />
          {t.settings.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.settings.storeInfo}
        </p>
      </div>

      {/* Store Info Card */}
      <Card className="border-slate-700 bg-white/5 p-6 backdrop-blur-md">
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
              <span className="text-emerald-300">
                {t.settings.saved}
              </span>
            </Alert>
          )}

          {/* Store Name */}
          <div className="space-y-2">
            <Label htmlFor="store-name" className="text-foreground">
              {t.settings.storeName}
            </Label>
            <Input
              id="store-name"
              value={settings.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: La Esperanza"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">
              {t.settings.location}
            </Label>
            <Input
              id="location"
              value={settings.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: Avenida Principal 123"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              {t.settings.phone}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={settings.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: +34 912 345 678"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              {t.settings.contactEmail}
            </Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500"
              placeholder="Ej: contacto@laesperanza.com"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.actions.loading}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t.settings.saveChanges}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 bg-destructive/5 p-6 backdrop-blur-md">
        <h3 className="text-destructive mb-3 text-lg font-semibold">
          {t.settings.dangerZone}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t.settings.dangerZoneDescription}
        </p>
        {activeStore && (
          <DeleteStoreModal
            storeName={activeStore.name}
            storeId={activeStore.id}
          />
        )}
      </Card>
    </div>
  );
}
