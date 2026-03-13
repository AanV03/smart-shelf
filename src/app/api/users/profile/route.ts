import { hash, compare } from "bcryptjs";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse, validateUserStatus } from "../utils";

const updateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  image: z.string().url("Imagen debe ser una URL válida").optional().nullable(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z
    .string()
    .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
    .optional(),
}).refine(
  (data) => {
    // Si proporciona newPassword, debe proporcionar currentPassword
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: "Se requiere la contraseña actual para cambiar la contraseña",
    path: ["currentPassword"],
  }
);

/**
 * PATCH /api/users/profile
 * Actualiza el perfil del usuario autenticado
 * 
 * Body:
 * - name?: string
 * - email?: string
 * - image?: string | null
 * - currentPassword?: string (requerido si se cambia password)
 * - newPassword?: string
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // Obtener el usuario actual de la BD
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Validar status
    if (!validateUserStatus(user.status)) {
      return errorResponse("Tu cuenta está suspendida o ha sido eliminada", 403);
    }

    const body = (await request.json()) as unknown;

    // Validar input
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError?.message ?? "Datos inválidos", 400);
    }

    const { name, email, image, currentPassword, newPassword } = validation.data;

    // Preparar datos a actualizar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Validar cambio de email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    if (email && email !== user.email) {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return errorResponse("Este email ya está registrado", 409);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.email = email;
    }

    // Validar y cambiar contraseña
    if (newPassword) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      if (!user.password) {
        return errorResponse("Tu cuenta no tiene contraseña configurada", 400);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const passwordsMatch = await compare(currentPassword!, user.password);

      if (!passwordsMatch) {
        return errorResponse("La contraseña actual es incorrecta", 401);
      }

      const hashedPassword = await hash(newPassword, 10);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.password = hashedPassword;
    }

    // Actualizar otros campos
    if (name !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.name = name;
    }

    if (image !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      updateData.image = image;
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: sessionUser.id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

    console.log("[USERS_PROFILE_UPDATE]", {
      userId: sessionUser.id,
      updatedFields: Object.keys(updateData),
    });

    return successResponse(
      {
        message: "Perfil actualizado exitosamente",
        user: updatedUser,
      },
      200
    );
  } catch (error) {
    console.error("[USERS_PROFILE_ERROR]", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
