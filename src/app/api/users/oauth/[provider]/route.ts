import type { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse, validateUserStatus } from "../../utils";

const disconnectOAuthSchema = z.object({
  provider: z.enum(["discord", "google"], {
    errorMap: () => ({ message: "Provider debe ser 'discord' o 'google'" }),
  }),
});

/**
 * DELETE /api/users/oauth/[provider]
 * Desvincula una cuenta OAuth del usuario
 * 
 * Query params:
 * - provider: "discord" | "google"
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: paramProvider } = await params;

    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // Validar provider
    const validation = disconnectOAuthSchema.safeParse({
      provider: paramProvider.toLowerCase(),
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return errorResponse(firstError?.message ?? "Provider inválido", 400);
    }

    const { provider } = validation.data;

    // Obtener el usuario y sus accounts
    const user = await db.user.findUnique({
      where: { id: sessionUser.id },
      include: { Account: true },
    });

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Validar status
    if (!validateUserStatus(user.status)) {
      return errorResponse("Tu cuenta está suspendida o ha sido eliminada", 403);
    }

    // Encontrar la cuenta OAuth a desconectar
    const oauthAccount = user.Account.find((acc) => acc.provider === provider);

    if (!oauthAccount) {
      return errorResponse(
        `Tu cuenta no está vinculada a ${provider}`,
        404
      );
    }

    // Validar que el usuario tenga al menos una forma de login:
    // O bien una contraseña, o bien otra cuenta OAuth
    const hasPassword = !!user.password;
    const hasOtherOAuthAccounts = user.Account.filter((acc) => acc.id !== oauthAccount.id).length > 0;

    if (!hasPassword && !hasOtherOAuthAccounts) {
      return errorResponse(
        `No puedes desconectar ${provider} porque es tu única forma de acceso. Por favor, establece una contraseña primero.`,
        400
      );
    }

    // Eliminar la cuenta OAuth
    await db.account.delete({
      where: { id: oauthAccount.id },
    });

    console.log("[USERS_OAUTH_DISCONNECT]", {
      userId: sessionUser.id,
      email: user.email,
      provider,
      timestamp: new Date().toISOString(),
    });

    return successResponse(
      {
        message: `Tu cuenta de ${provider} ha sido desvinculada exitosamente.`,
      },
      200
    );
  } catch (error) {
    console.error("[USERS_OAUTH_DISCONNECT_ERROR]", error);
    return errorResponse("Error interno del servidor", 500);
  }
}
