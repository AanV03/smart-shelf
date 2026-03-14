import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import { requireAuth, errorResponse, successResponse } from "@/app/api/users/utils";
import { sendInvitationEmail } from "@/server/email/send-invitation";
import { generateInvitationToken, generateInvitationUrl } from "@/server/team/invitation";

/**
 * POST /api/team/invite
 * Invita a un nuevo miembro al equipo
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // Validar que el usuario sea ADMIN
    const isAdmin = sessionUser.stores?.some(
      (store) => store.role === "ADMIN" && store.status === "ACTIVE"
    );

    if (!isAdmin) {
      return errorResponse("Solo administradores pueden invitar miembros", 403);
    }

    const body = await request.json() as {
      email: string;
      role: "MANAGER" | "EMPLOYEE";
      storeId: string;
    };

    const { email, role, storeId } = body;

    if (!email || !role || !storeId) {
      return errorResponse(
        "Email, role y storeId son requeridos",
        400
      );
    }

    // Validar que el usuario tenga acceso a esta store
    const hasAccessToStore = sessionUser.stores?.some(
      (store) => store.id === storeId && store.role === "ADMIN"
    );

    if (!hasAccessToStore) {
      return errorResponse("No tienes acceso a esta tienda", 403);
    }

    // Buscar o crear usuario
    let user = await db.user.findUnique({
      where: { email },
    });

    user ??= await db.user.create({
      data: {
        email,
        status: "ACTIVE",
      },
    });

    // Validar que no sea ya miembro activo
    const existingMember = await db.storeMember.findUnique({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId,
        },
      },
    });

    if (existingMember && existingMember.status === "ACTIVE") {
      return errorResponse("Este usuario ya es miembro activo de la tienda", 400);
    }

    // Generar token de invitación
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Crear InvitationToken
    const invitationToken = await db.invitationToken.create({
      data: {
        email,
        token,
        storeId,
        role: role as "ADMIN" | "MANAGER" | "EMPLOYEE",
        expiresAt,
      },
    });

    // Generar URL de aceptación
    const acceptUrl = generateInvitationUrl(token);

    // Obtener nombre de la tienda
    const store = await db.store.findUnique({
      where: { id: storeId },
    });

    // Enviar email de invitación
    try {
      await sendInvitationEmail({
        to: email,
        recipientName: user.name ?? "Usuario",
        storeName: store?.name || "Smart-Shelf",
        role: role === "MANAGER" ? "Manager" : "Empleado",
        acceptUrl,
      });
    } catch (emailError) {
      console.error("[TEAM_INVITE_EMAIL_ERROR]", emailError);
      const errorMsg = emailError instanceof Error ? emailError.message : "Error desconocido al enviar email";
      return errorResponse(`Error enviando email de invitación: ${errorMsg}`, 500);
    }

    console.log("[TEAM_INVITE] Invitation created successfully", {
      email,
      storeId,
      role,
      tokenId: invitationToken.id,
      invitedByUserId: sessionUser.id,
    });

    return successResponse(
      {
        message: "Invitación enviada correctamente. El usuario recibirá un email con el enlace de aceptación.",
        invitationToken: {
          id: invitationToken.id,
          email: invitationToken.email,
          expiresAt: invitationToken.expiresAt,
        },
      },
      201
    );
  } catch (error) {
    console.error("[TEAM_INVITE_ERROR]", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("Ya existe una invitación pendiente para este email", 409);
    }

    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return errorResponse(`Error al crear invitación: ${errorMessage}`, 500);
  }
}
