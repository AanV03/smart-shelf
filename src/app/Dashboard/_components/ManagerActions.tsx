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
  const [uploadedFile, setUploadedFile] = useState<UploadFileResponse | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Verificar si el usuario es MANAGER o ADMIN (solo para upload)
  const hasManagerRole = session?.user?.stores?.some(
    (store) =>
      (store.role === "MANAGER" || store.role === "ADMIN") &&
      store.status === "ACTIVE",
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
            <AlertCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h3 className="text-foreground font-semibold">
                Acceso restringido
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Solo gerentes y administradores pueden acceder a estas
                funciones.
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
        const errorData = (await response.json()) as { message: string };
        throw new Error(errorData.message || "Error en la carga");
      }

      const data = (await response.json()) as { data: UploadFileResponse };
      setUploadedFile(data.data);
      setSelectedFile(null);

      // Limpiar input
      const fileInput = document.getElementById(
        "file-input",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido";
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
          <div className="mb-4 flex items-center gap-3">
            <Upload className="h-5 w-5 text-amber-500" aria-hidden="true" />
            <h2 className="text-foreground text-lg font-semibold">
              Subir Reporte
            </h2>
          </div>

          <p className="text-muted-foreground mb-6 text-sm">
            Carga un archivo de reporte (PDF, CSV, Excel, imagen) para
            almacenamiento seguro.
          </p>

          {uploadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{uploadError}</span>
            </Alert>
          )}

          {uploadedFile && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm font-medium">
                    Archivo subido con éxito
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs break-all">
                    {uploadedFile.fileName}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tamaño: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <a
                    href={uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block rounded px-1 text-xs text-emerald-500 transition-colors duration-150 hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    Ver archivo →
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="group relative">
              <input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".pdf,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                aria-label="Seleccionar archivo para subir"
                aria-describedby="file-help"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <div className="border-muted-foreground/30 focus-within:ring-offset-background relative rounded-lg border-2 border-dashed bg-white/5 px-4 py-6 transition-all duration-200 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:ring-offset-2 hover:border-emerald-500/50 hover:bg-emerald-500/5">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="text-muted-foreground h-6 w-6 transition-colors group-hover:text-emerald-500" />
                  <div className="text-center">
                    <p className="text-foreground text-sm font-medium">
                      {selectedFile
                        ? selectedFile.name
                        : "Arrastra tu archivo aquí"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {selectedFile
                        ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                        : "o haz clic para seleccionar"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p id="file-help" className="text-muted-foreground text-xs">
              Máximo 50 MB. Formatos: PDF, CSV, Excel, JPG, PNG, WebP
            </p>

            <Button
              onClick={handleUploadReport}
              disabled={!selectedFile || uploading}
              size="lg"
              className="w-full bg-amber-600 font-medium text-white transition-colors duration-200 hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
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
