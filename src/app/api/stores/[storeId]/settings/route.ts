import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "@/app/api/users/utils";

/**
 * PATCH /api/stores/[storeId]/settings
 * Actualiza la configuración de la tienda
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;
    const { storeId } = await params;

    // Validar que el usuario sea ADMIN de esta tienda
    const isAdmin = sessionUser.stores?.some(
      (store) => store.id === storeId && store.role === "ADMIN"
    );

    if (!isAdmin) {
      return errorResponse("No tienes permiso para modificar esta tienda", 403);
    }

    const body = await request.json() as {
      name?: string;
      location?: string;
      phone?: string;
      email?: string;
    };

    // Validar que al menos existe el nombre
    if (body.name && body.name.trim().length < 2) {
      return errorResponse("El nombre debe tener al menos 2 caracteres", 400);
    }

    // Actualizar la tienda
    const updatedStore = await db.store.update({
      where: { id: storeId },
      data: {
        name: body.name,
        location: body.location,
        // Nota: phone y email podrían requerer un modelo extendido si no existen en Store
      },
    });

    console.log("[SETTINGS_UPDATE] Store settings updated", {
      storeId,
      updatedByUserId: sessionUser.id,
      settings: body,
    });

    return successResponse(
      {
        message: "Configuración actualizada correctamente",
        store: updatedStore,
      },
      200
    );
  } catch (error) {
    console.error("[SETTINGS_UPDATE_ERROR]", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("Ya existe una tienda con ese nombre", 409);
    }

    return errorResponse("Error al actualizar configuración", 500);
  }
}
