import type { NextRequest } from "next/server";
import { put, del } from "@vercel/blob";
import { requireAuth, errorResponse, successResponse } from "../users/utils";

/**
 * POST /api/upload-report
 * Sube un archivo de reporte a Vercel Blob
 * Solo disponible para usuarios autenticados
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Validar autenticación
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // ✅ Parsear FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    // ✅ Validaciones del archivo
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    const ALLOWED_TYPES = [
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "El archivo no debe superar 50MB",
        413
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        "Formato de archivo no permitido. Usa PDF, CSV, Excel, JPG, PNG o WebP",
        415
      );
    }

    // ✅ Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const sanitizedFileName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .substring(0, 50);

    const fileName = `reports/${sessionUser.id}/${timestamp}-${randomStr}-${sanitizedFileName}`;

    // ✅ Subir a Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false, // Usamos nuestro naming system
    });

    console.log("[UPLOAD_REPORT] File uploaded successfully", {
      userId: sessionUser.id,
      fileName: file.name,
      blobUrl: blob.url,
      size: file.size,
    });

    // ✅ Retornar URL del archivo
    return successResponse(
      {
        url: blob.url,
        fileName: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
      200
    );
  } catch (error) {
    console.error("[UPLOAD_REPORT_ERROR]", error);

    if (error instanceof Error) {
      if (error.message.includes("blob")) {
        return errorResponse(
          "Error al subir el archivo. Por favor intenta de nuevo.",
          502
        );
      }
    }

    return errorResponse("Error interno del servidor", 500);
  }
}

/**
 * DELETE /api/upload-report?url=...
 * Elimina un archivo del blob (solo si pertenece al usuario)
 */
export async function DELETE(request: NextRequest) {
  try {
    // ✅ Validar autenticación
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // ✅ Obtener URL a eliminar
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return errorResponse("URL del archivo requerida", 400);
    }

    // ✅ Validar que la URL pertenece al usuario (seguridad)
    if (!url.includes(`/reports/${sessionUser.id}/`)) {
      console.warn("[DELETE_REPORT] User attempting to delete file not owned by them", {
        userId: sessionUser.id,
        attemptedUrl: url,
      });
      return errorResponse("No tienes permiso para eliminar este archivo", 403);
    }

    // ✅ Eliminar del blob
    await del(url);

    console.log("[DELETE_REPORT] File deleted successfully", {
      userId: sessionUser.id,
      url,
    });

    return successResponse(
      {
        message: "Archivo eliminado correctamente",
      },
      200
    );
  } catch (error) {
    console.error("[DELETE_REPORT_ERROR]", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return errorResponse("El archivo no existe", 404);
      }
    }

    return errorResponse("Error al eliminar el archivo", 500);
  }
}
