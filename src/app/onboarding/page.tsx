"use client";

import { useState } from "react";
import { CreateStoreForm } from "@/app/onboarding/_components/CreateStoreForm";
import { JoinStoreForm } from "@/app/onboarding/_components/JoinStoreForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, UserPlus } from "lucide-react";

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background decorative elements */}
      <div
        className="absolute inset-0 -z-10 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl opacity-20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl opacity-10" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Bienvenido a <span className="text-primary">Smart Shelf</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
            Crea una nueva tienda o únete a una existente para gestionar tu inventario
          </p>
        </div>

        {/* Tabs Container */}
        <div className="bg-card/40 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-6 sm:p-8 lg:p-10">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Tab List */}
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1">
              <TabsTrigger
                value="create"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <Building2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Crear</span>
                <span className="sm:hidden">Nueva</span>
              </TabsTrigger>
              <TabsTrigger
                value="join"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Unirse</span>
                <span className="sm:hidden">Código</span>
              </TabsTrigger>
            </TabsList>

            {/* Create Store Tab */}
            <TabsContent value="create" className="space-y-4 animate-in fade-in-50 duration-300">
              <CreateStoreForm />
            </TabsContent>

            {/* Join Store Tab */}
            <TabsContent value="join" className="space-y-4 animate-in fade-in-50 duration-300">
              <JoinStoreForm />
            </TabsContent>
          </Tabs>

          {/* Footer Info */}
          <div className="mt-10 pt-6 border-t border-border/50 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Crear Tienda
                </h3>
                <p className="text-xs text-muted-foreground">
                  Conviértete en ADMIN de tu tienda. Podrás invitar a otros usuarios e ir construyendo tu equipo.
                </p>
              </div>
              <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" aria-hidden="true" />
                  Unirse
                </h3>
                <p className="text-xs text-muted-foreground">
                  Si ya tienes un código, únete como Employee o Manager a una tienda existente.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              ¿Problemas? <a href="/auth/login" className="text-primary hover:underline">Volver al inicio de sesión</a>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          <div className="text-center space-y-2 p-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">1</span>
            </div>
            <h4 className="font-medium text-foreground">Registra</h4>
            <p className="text-xs text-muted-foreground">
              Tu cuenta o tienda en segundos
            </p>
          </div>
          <div className="text-center space-y-2 p-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">2</span>
            </div>
            <h4 className="font-medium text-foreground">Gestiona</h4>
            <p className="text-xs text-muted-foreground">
              Tu inventario y batches
            </p>
          </div>
          <div className="text-center space-y-2 p-4">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">3</span>
            </div>
            <h4 className="font-medium text-foreground">Escala</h4>
            <p className="text-xs text-muted-foreground">
              Agrega más tiendas o usuarios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
