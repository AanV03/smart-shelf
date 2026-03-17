"use client";

import { useState } from "react";
import { CreateStoreForm } from "@/app/onboarding/_components/CreateStoreForm";
import { JoinStoreForm } from "@/app/onboarding/_components/JoinStoreForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, UserPlus } from "lucide-react";
import { useI18n } from "@/lib/i18n-client";

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("create");
  const { t } = useI18n();

  return (
    <div className="from-background via-background to-background/80 flex min-h-screen items-center justify-center bg-gradient-to-br p-4 sm:p-6 lg:p-8">
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="bg-primary/10 absolute -top-40 -right-40 h-80 w-80 rounded-full opacity-20 blur-3xl" />
        <div className="bg-primary/5 absolute -bottom-40 -left-40 h-80 w-80 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-12 space-y-3 text-center">
          <h1 className="text-foreground text-4xl font-bold tracking-tight sm:text-5xl">
            {t.onboarding.title.split(" ").slice(0, -2).join(" ")} <span className="text-primary">{t.onboarding.title.split(" ").slice(-2).join(" ")}</span>
          </h1>
          <p className="text-muted-foreground mx-auto max-w-md text-base sm:text-lg">
            {t.onboarding.subtitle}
          </p>
        </div>

        {/* Tabs Container */}
        <div className="bg-card/40 border-border rounded-2xl border p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:p-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Tab List */}
            <TabsList className="bg-muted/50 mb-8 grid w-full grid-cols-2 p-1">
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-all"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.onboarding.createTabLabel}</span>
                <span className="sm:hidden">{t.onboarding.createTabLabelMobile}</span>
              </TabsTrigger>
              <TabsTrigger
                value="join"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 transition-all"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t.onboarding.joinTabLabel}</span>
                <span className="sm:hidden">{t.onboarding.joinTabLabelMobile}</span>
              </TabsTrigger>
            </TabsList>

            {/* Create Store Tab */}
            <TabsContent
              value="create"
              className="animate-in fade-in-50 space-y-4 duration-300"
            >
              <CreateStoreForm />
            </TabsContent>

            {/* Join Store Tab */}
            <TabsContent
              value="join"
              className="animate-in fade-in-50 space-y-4 duration-300"
            >
              <JoinStoreForm />
            </TabsContent>
          </Tabs>

          {/* Footer Info */}
          <div className="border-border/50 mt-10 space-y-4 border-t pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-muted/30 border-border/50 space-y-2 rounded-lg border p-3">
                <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  <Building2
                    className="text-primary h-4 w-4"
                    aria-hidden="true"
                  />
                  Crear Tienda
                </h3>
                <p className="text-muted-foreground text-xs">
                  Conviértete en ADMIN de tu tienda. Podrás invitar a otros
                  usuarios e ir construyendo tu equipo.
                </p>
              </div>
              <div className="bg-muted/30 border-border/50 space-y-2 rounded-lg border p-3">
                <h3 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                  <UserPlus
                    className="text-primary h-4 w-4"
                    aria-hidden="true"
                  />
                  Unirse
                </h3>
                <p className="text-muted-foreground text-xs">
                  Si ya tienes un código, únete como Employee o Manager a una
                  tienda existente.
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-center text-xs">
              ¿Problemas?{" "}
              <a href="/auth/login" className="text-primary hover:underline">
                Volver al inicio de sesión
              </a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 p-4 text-center">
            <div className="bg-primary/10 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-primary font-bold">1</span>
            </div>
            <h4 className="text-foreground font-medium">Registra</h4>
            <p className="text-muted-foreground text-xs">
              Tu cuenta o tienda en segundos
            </p>
          </div>
          <div className="space-y-2 p-4 text-center">
            <div className="bg-primary/10 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-primary font-bold">2</span>
            </div>
            <h4 className="text-foreground font-medium">Gestiona</h4>
            <p className="text-muted-foreground text-xs">
              Tu inventario y batches
            </p>
          </div>
          <div className="space-y-2 p-4 text-center">
            <div className="bg-primary/10 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full">
              <span className="text-primary font-bold">3</span>
            </div>
            <h4 className="text-foreground font-medium">Escala</h4>
            <p className="text-muted-foreground text-xs">
              Agrega más tiendas o usuarios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
