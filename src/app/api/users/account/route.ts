import type { NextRequest } from "next/server";
import { z } from "zod";
import { compare } from "bcryptjs";

import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse, validateUserStatus } from "../utils";

const deleteAccountSchema = z.object({
  password: z.string().min(6, "Se requiere contraseña para confirmar eliminación"),
  confirmation: z.literal(true, {
    errorMap: () => ({ message: "Debes confirmar la eliminación de tu cuenta" }),
  }),
});

/**
 * DELETE /api/users/account
 * Elimina definitivamente la cuenta del usuario y todos sus datos asociados
 * 
 * Body:
 * - password: string (requerido para confirmar identidad)
 * - confirmation: true (confirmación explícita)
 * 
 * Validación Multi-Tenant:
 * - Si el usuario es el único ADMIN de una tienda, la eliminación falla
 * - Debe transferir a otro ADMIN o eliminar la tienda primero
 * 
 * Eliminación en cascada:
 * - Elimina StoreMember (relaciones con tiendas)
 * - Elimina todas las sesiones
 * - Elimina todos los accounts (OAuth)
 * - Elimina al usuario
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // Obtener el usuario actual con sus relaciones
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: {
        Account: true,
        Session: true,
        storeMembers: {
          select: {
            id: true,
            storeId: true,
            role: true,
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    const body = (await request.json()) as unknown;

    // Validar input
    const validation = deleteAccountSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError?.message ?? "Datos inválidos", 400);
    }

    const { password, confirmation } = validation.data;

    // Si el usuario tiene contraseña, validarla
    if (user.password) {
      const passwordsMatch = await compare(password, user.password);

      if (!passwordsMatch) {
        return errorResponse("La contraseña es incorrecta", 401);
      }
    } else if (!user.Account || user.Account.length === 0) {
      // Si no tiene contraseña ni accounts OAuth, algo está mal
      return errorResponse("No se puede verificar la identidad del usuario", 400);
    }

    // NEW: Multi-tenant validation
    // Verificar si el usuario es el único ADMIN de alguna tienda
    const adminStores = user.storeMembers.filter((member) => member.role === "ADMIN");

    if (adminStores.length > 0) {
      // Para cada tienda donde es ADMIN, contar otros ADMINs
      for (const adminStore of adminStores) {
        const otherAdmins = await db.storeMember.count({
          where: {
            storeId: adminStore.storeId,
            role: "ADMIN",
            userId: { not: sessionUser.id }, // Exclude current user
          },
        });

        // Si no hay otros admins en esta tienda, impedir eliminación
        if (otherAdmins === 0) {
          return errorResponse(
            `No puedes eliminar tu cuenta porque eres el único administrador de la tienda "${adminStore.store.name}". ` +
            `Por favor, transfiere el rol de administrador a otro usuario o elimina la tienda primero.`,
            400
          );
        }
      }
    }

    // Log de eliminación antes de proceder
    const userEmail = user.email;
    const userAccounts = user.Account.map((acc) => ({
      provider: acc.provider,
      id: acc.id,
    }));
    const storesAffected = user.storeMembers.map((member) => ({
      storeId: member.storeId,
      role: member.role,
      storeName: member.store.name,
    }));

    // Eliminar la cuenta del usuario
    // El onDelete: Cascade en Prisma eliminará automáticamente:
    // - StoreMember (vinculos con tiendas)
    // - Sessions (sesiones activas)
    // - Accounts (vinculos OAuth como Discord/Google)
    await db.user.delete({
      where: { id: sessionUser.id },
    });

    console.log("[USERS_ACCOUNT_DELETE]", {
      userId: sessionUser.id,
      email: userEmail,
      accountsDeleted: userAccounts,
      storesAffected,
      confirmation,
      timestamp: new Date().toISOString(),
    });

    return successResponse(
      {
        message: "Tu cuenta y todos tus datos asociados han sido eliminados permanentemente.",
      },
      200
    );
  } catch (error) {
    console.error("[USERS_ACCOUNT_DELETE_ERROR]", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
