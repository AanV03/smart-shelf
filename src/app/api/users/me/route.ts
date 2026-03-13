import type { NextRequest } from "next/server";

import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "../utils";

/**
 * GET /api/users/me
 * Obtiene los datos del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        Account: {
          select: {
            id: true,
            provider: true,
            type: true,
          },
        },
        storeMembers: {
          select: {
            store: {
              select: {
                id: true,
                name: true,
              },
            },
            role: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    return successResponse({
      user,
    });
  } catch (error) {
    console.error("[USERS_ME_ERROR]", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
