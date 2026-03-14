/**
 * Event Handlers: Invitation Flow
 *
 * Procesa eventos de invitación:
 * - manager.invited → Enviar email al manager
 * - employee.invited → Enviar email al empleado
 */

import { db } from "@/server/db";
import { eventBus, type Event } from "./event-bus";
import { sendInvitationEmail } from "@/server/email/send-invitation";

/**
 * Handler: Manager invited
 *
 * Flow:
 * 1. Admin invita manager → evento manager.invited
 * 2. Este handler corre en background
 * 3. Envía email con link de aceptación
 * 4. Manager hace click → actualiza StoreMember.status = ACTIVE
 */
export async function onManagerInvited(event: Event): Promise<void> {
  const payload = event.payload as {
    storeId: string;
    userId: string;
    email: string;
    storeName: string;
  };

  console.log("[EVENT_HANDLER] Processing manager.invited", {
    eventId: event.id,
    email: payload.email,
    storeId: payload.storeId,
  });

  try {
    // Get manager user details
    const manager = await db.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true },
    });

    if (!manager?.email) {
      throw new Error(`Manager not found or has no email: ${payload.userId}`);
    }

    // Get store details
    const store = await db.store.findUnique({
      where: { id: payload.storeId },
      select: { name: true },
    });

    if (!store) {
      throw new Error(`Store not found: ${payload.storeId}`);
    }

    // Generate acceptance token (embed in URL)
    const acceptToken = Buffer.from(
      JSON.stringify({
        userId: payload.userId,
        storeId: payload.storeId,
        type: "manager",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }),
    ).toString("base64");

    const acceptUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/invitations/accept?token=${acceptToken}`;

    // Send email
    await sendInvitationEmail({
      to: manager.email,
      recipientName: manager.name ?? "Gerente",
      storeName: store.name,
      role: "Manager",
      acceptUrl,
    });

    console.log("[EVENT_HANDLER] Manager invitation sent successfully", {
      email: manager.email,
    });
  } catch (error) {
    console.error("[EVENT_HANDLER] Error processing manager.invited", error);
    throw error;
  }
}

/**
 * Handler: Employee invited
 *
 * Same flow as manager invitation, but for employees
 */
export async function onEmployeeInvited(event: Event): Promise<void> {
  const payload = event.payload as {
    storeId: string;
    userId: string;
    email: string;
    storeName: string;
  };

  console.log("[EVENT_HANDLER] Processing employee.invited", {
    eventId: event.id,
    email: payload.email,
    storeId: payload.storeId,
  });

  try {
    // Get employee user details
    const employee = await db.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true },
    });

    if (!employee?.email) {
      throw new Error(`Employee not found or has no email: ${payload.userId}`);
    }

    // Get store details
    const store = await db.store.findUnique({
      where: { id: payload.storeId },
      select: { name: true },
    });

    if (!store) {
      throw new Error(`Store not found: ${payload.storeId}`);
    }

    // Generate acceptance token
    const acceptToken = Buffer.from(
      JSON.stringify({
        userId: payload.userId,
        storeId: payload.storeId,
        type: "employee",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }),
    ).toString("base64");

    const acceptUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/invitations/accept?token=${acceptToken}`;

    // Send email
    await sendInvitationEmail({
      to: employee.email,
      recipientName: employee.name ?? "Empleado",
      storeName: store.name,
      role: "Empleado",
      acceptUrl,
    });

    console.log("[EVENT_HANDLER] Employee invitation sent successfully", {
      email: employee.email,
    });
  } catch (error) {
    console.error("[EVENT_HANDLER] Error processing employee.invited", error);
    throw error;
  }
}

/**
 * Register all event handlers
 *
 * Call this once during app startup
 */
export function registerInvitationHandlers(): void {
  console.log("[EVENT_HANDLERS] Registering invitation handlers");

  eventBus.subscribe("manager.invited", onManagerInvited);
  eventBus.subscribe("employee.invited", onEmployeeInvited);
}
