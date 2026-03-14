import type { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import {
  requireAuth,
  errorResponse,
  successResponse,
  validateUserStatus,
} from "../../utils";

const suspendAccountSchema = z.object({
  reason: z.string().optional().default(""),
});

/**
 * PATCH /api/users/account/suspend
 * Suspende la cuenta del usuario (soft delete)
 * El usuario no podrá hacer login pero sus datos se mantienen
 *
 * Body:
 * - reason?: string (opcional, para logging)
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // Obtener el usuario actual
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Validar que la cuenta esté activa
    if (user.status !== "ACTIVE") {
      return errorResponse(
        "Tu cuenta ya está suspendida o ha sido eliminada",
        400,
      );
    }

    const body = (await request.json()) as unknown;
    const validation = suspendAccountSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Datos de entrada inválidos", 400);
    }

    const { reason } = validation.data;

    // Suspender la cuenta
    const suspendedUser = await db.user.update({
      where: { id: sessionUser.id },
      data: {
        status: "SUSPENDED",
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        updatedAt: true,
      },
    });

    // Invalidar todas las sesiones activas del usuario
    await db.session.deleteMany({
      where: { userId: sessionUser.id },
    });

    console.log("[USERS_ACCOUNT_SUSPEND]", {
      userId: sessionUser.id,
      email: user.email,
      reason,
      timestamp: new Date().toISOString(),
    });

    return successResponse(
      {
        message:
          "Tu cuenta ha sido suspendida exitosamente. No podrás iniciar sesión hasta que la reactives.",
        user: suspendedUser,
      },
      200,
    );
  } catch (error) {
    console.error("[USERS_ACCOUNT_SUSPEND_ERROR]", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
