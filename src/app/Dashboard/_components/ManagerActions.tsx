"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

interface UploadFileResponse {
  url: string;
  fileName: string;
  size: number;
  uploadedAt: string;
}

export function ManagerActions() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadFileResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Verificar si el usuario es MANAGER o ADMIN (solo para upload)
  const hasManagerRole = session?.user?.stores?.some(
    (store) => (store.role === "MANAGER" || store.role === "ADMIN") && store.status === "ACTIVE"
  );

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!hasManagerRole) {
    return (
      <Card className="border-destructive/50 bg-white/5 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-foreground">Acceso restringido</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Solo gerentes y administradores pueden acceder a estas funciones.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  // Manejar upload de archivo
  const handleUploadReport = async () => {
    if (!selectedFile) {
      setUploadError("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadedFile(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/upload-report", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as { message: string };
        throw new Error(errorData.message || "Error en la carga");
      }

      const data = (await response.json()) as { data: UploadFileResponse };
      setUploadedFile(data.data);
      setSelectedFile(null);

      // Limpiar input
      const fileInput = document.getElementById("file-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      setUploadError(message);
      console.error("[UPLOAD_ERROR]", error);
    } finally {
      setUploading(false);
    }
  };

  // Manager no tiene acceso a planes - esto no debería renderizarse
  // Solo ADMIN puede cambiar planes

  return (
    <div className="space-y-6">
      {/* Sección de Reporte */}
      <Card className="border-amber-500/20 bg-linear-to-br from-white/10 to-white/5 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">
              Subir Reporte
            </h2>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Carga un archivo de reporte (PDF, CSV, Excel, imagen) para almacenamiento
            seguro.
          </p>

          {uploadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </Alert>
          )}

          {uploadedFile && (
            <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Archivo subido con éxito</p>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {uploadedFile.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tamaño: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-500 hover:text-emerald-400 mt-2 inline-block
                               transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded px-1"
                  >
                    Ver archivo → 
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div
              className="relative group"
            >
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".pdf,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                aria-label="Seleccionar archivo para subir"
                aria-describedby="file-help"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div
                className="relative px-4 py-6 border-2 border-dashed border-muted-foreground/30 rounded-lg
                           hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200
                           bg-white/5 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-2
                           focus-within:ring-offset-background"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {selectedFile ? selectedFile.name : "Arrastra tu archivo aquí"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "o haz clic para seleccionar"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p id="file-help" className="text-xs text-muted-foreground">
              Máximo 50 MB. Formatos: PDF, CSV, Excel, JPG, PNG, WebP
            </p>

            <Button
              onClick={handleUploadReport}
              disabled={!selectedFile || uploading}
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium
                         transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={uploading}
              aria-label="Subir archivo de reporte"
            >
              {uploading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {uploading ? "Subiendo..." : "Subir Archivo"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
