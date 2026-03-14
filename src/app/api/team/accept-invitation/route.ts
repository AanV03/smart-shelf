import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "@/app/api/users/utils";

/**
 * GET /api/team/accept-invitation?token=...
 * Acepta una invitación de equipo
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return errorResponse("Token de invitación requerido", 400);
    }

    // Buscar el token de invitación
    const invitationToken = await db.invitationToken.findUnique({
      where: { token },
      include: {
        store: true,
      },
    });

    if (!invitationToken) {
      return errorResponse("Token de invitación inválido o expirado", 404);
    }

    // Validar que no esté expirado
    if (invitationToken.expiresAt < new Date()) {
      return errorResponse("La invitación ha expirado", 410);
    }

    // Validar que no haya sido usado ya
    if (invitationToken.usedAt) {
      return errorResponse("Esta invitación ya fue aceptada", 400);
    }

    // Obtener usuario autenticado
    const auth = await requireAuth();
    if (!auth.isValid) {
      // Si no está autenticado, redirigir a login con token en param
      return errorResponse(
        "Debes estar autenticado para aceptar la invitación",
        401
      );
    }

    const { user: sessionUser } = auth.session!;

    // Validar que el email coincida
    if (sessionUser.email?.toLowerCase() !== invitationToken.email.toLowerCase()) {
      return errorResponse(
        "El email de tu cuenta no coincide con el de la invitación",
        403
      );
    }

    // Crear StoreMember
    const existingMember = await db.storeMember.findUnique({
      where: {
        userId_storeId: {
          userId: sessionUser.id,
          storeId: invitationToken.storeId,
        },
      },
    });

    if (existingMember) {
      // Si ya existe, actualizar al estado ACTIVE si estaba INVITED
      if (existingMember.status !== "ACTIVE") {
        await db.storeMember.update({
          where: { id: existingMember.id },
          data: { status: "ACTIVE" },
        });
      }
    } else {
      // Crear nuevo StoreMember
      await db.storeMember.create({
        data: {
          userId: sessionUser.id,
          storeId: invitationToken.storeId,
          role: invitationToken.role,
          status: "ACTIVE",
        },
      });
    }

    // Marcar token como usado
    await db.invitationToken.update({
      where: { id: invitationToken.id },
      data: {
        usedAt: new Date(),
        usedBy: sessionUser.id,
      },
    });

    console.log("[ACCEPT_INVITATION] Invitation accepted", {
      userId: sessionUser.id,
      storeId: invitationToken.storeId,
      role: invitationToken.role,
      tokenId: invitationToken.id,
    });

    return successResponse(
      {
        message: "¡Invitación aceptada! Bienvenido al equipo.",
        store: {
          id: invitationToken.store.id,
          name: invitationToken.store.name,
        },
        role: invitationToken.role,
      },
      200
    );
  } catch (error) {
    console.error("[ACCEPT_INVITATION_ERROR]", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("Ya eres miembro de este equipo", 409);
    }

    return errorResponse("Error al aceptar invitación", 500);
  }
}
