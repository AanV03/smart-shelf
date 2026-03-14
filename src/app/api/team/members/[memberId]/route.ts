import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "@/app/api/users/utils";

/**
 * DELETE /api/team/members/[memberId]
 * Elimina un miembro del equipo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;
    const { memberId } = await params;

    // Validar que el usuario sea ADMIN
    const isAdmin = sessionUser.stores?.some(
      (store) => store.role === "ADMIN" && store.status === "ACTIVE"
    );

    if (!isAdmin) {
      return errorResponse("Solo administradores pueden eliminar miembros", 403);
    }

    // Buscar el miembro a eliminar
    const storeMember = await db.storeMember.findUnique({
      where: { id: memberId },
      include: {
        store: true,
      },
    });

    if (!storeMember) {
      return errorResponse("Miembro no encontrado", 404);
    }

    // Validar que el usuario tenga acceso a esta store
    const hasAccessToStore = sessionUser.stores?.some(
      (store) => store.id === storeMember.storeId && store.role === "ADMIN"
    );

    if (!hasAccessToStore) {
      return errorResponse("No tienes acceso a esta tienda", 403);
    }

    // Evitar eliminar al último admin
    const adminCount = await db.storeMember.count({
      where: {
        storeId: storeMember.storeId,
        role: "ADMIN",
        status: "ACTIVE",
      },
    });

    if (storeMember.role === "ADMIN" && adminCount <= 1) {
      return errorResponse(
        "No puedes eliminar al último administrador",
        400
      );
    }

    // Eliminar el miembro
    await db.storeMember.delete({
      where: { id: memberId },
    });

    console.log("[TEAM_DELETE_MEMBER] Member removed", {
      memberId,
      userId: storeMember.userId,
      storeId: storeMember.storeId,
      removedByUserId: sessionUser.id,
    });

    return successResponse(
      {
        message: "Miembro eliminado correctamente",
      },
      200
    );
  } catch (error) {
    console.error("[TEAM_DELETE_MEMBER_ERROR]", error);
    return errorResponse("Error al eliminar miembro", 500);
  }
}
