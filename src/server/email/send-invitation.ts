/**
 * Email Service: Invitations
 *
 * Utiliza Resend para enviar emails de invitación
 */

import { env } from "@/env";

interface SendInvitationEmailInput {
  to: string;
  recipientName: string;
  storeName: string;
  role: "Manager" | "Empleado";
  acceptUrl: string;
}

interface InvitationEmailHTMLInput {
  recipientName: string;
  storeName: string;
  role: "Manager" | "Empleado";
  acceptUrl: string;
}

/**
 * Send invitation email via Resend
 */
export async function sendInvitationEmail({
  to,
  recipientName,
  storeName,
  role,
  acceptUrl,
}: SendInvitationEmailInput): Promise<void> {
  console.log("[EMAIL_SERVICE] Sending invitation email", {
    to,
    role,
    storeName,
  });

  if (!env.RESEND_API_KEY) {
    const errorMsg =
      "[EMAIL_SERVICE] RESEND_API_KEY not configured - email sending disabled";
    console.error(errorMsg);
    if (process.env.NODE_ENV === "development") {
      throw new Error(errorMsg);
    }
    return;
  }

  try {
    const emailPayload = {
      from: env.RESEND_FROM_EMAIL ?? "noreply@smart-shelf.app",
      to,
      subject: `¡Bienvenido a ${storeName}!`,
      html: generateInvitationHTML({
        recipientName,
        storeName,
        role,
        acceptUrl,
      }),
    };

    console.log("[EMAIL_SERVICE] Request payload", {
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const errorMsg = `Resend API error (${response.status}): ${JSON.stringify(responseData)}`;
      console.error("[EMAIL_SERVICE]", errorMsg);
      throw new Error(errorMsg);
    }

    const { id } = responseData as { id: string };
    console.log("[EMAIL_SERVICE] Invitation email sent successfully", {
      id,
      to,
    });
  } catch (error) {
    console.error("[EMAIL_SERVICE] Error sending invitation email", error);
    if (process.env.NODE_ENV === "development") {
      throw error;
    }
    // In production: log but don't throw - email sending is non-critical
  }
}

/**
 * Generate invitation email HTML
 */
function generateInvitationHTML({
  recipientName,
  storeName,
  role,
  acceptUrl,
}: InvitationEmailHTMLInput): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Invitación - Smart-Shelf</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: #333;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background: #f5f5f5;
      }
      .card {
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 28px;
        font-weight: bold;
        color: #1a1a1a;
        margin-bottom: 10px;
      }
      .tagline {
        color: #666;
        font-size: 14px;
      }
      .content {
        margin-bottom: 30px;
      }
      .greeting {
        font-size: 18px;
        margin-bottom: 20px;
      }
      .message {
        color: #555;
        margin-bottom: 20px;
        line-height: 1.8;
      }
      .cta-button {
        display: inline-block;
        background: #1a1a1a;
        color: white;
        padding: 12px 32px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 20px 0;
      }
      .cta-button:hover {
        background: #333;
      }
      .footer {
        border-top: 1px solid #eee;
        padding-top: 20px;
        color: #999;
        font-size: 12px;
      }
      .store-badge {
        display: inline-block;
        background: #f0f0f0;
        padding: 8px 16px;
        border-radius: 4px;
        margin: 10px 0;
        font-weight: 600;
        color: #1a1a1a;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="card">
        <div class="header">
          <div class="logo">📦 Smart-Shelf</div>
          <div class="tagline">Gestión Inteligente de Inventario</div>
        </div>

        <div class="content">
          <div class="greeting">¡Hola ${recipientName}!</div>

          <div class="message">
            <p>Has sido invitado a unirte como <strong>${role}</strong> en:</p>
            <div class="store-badge">${storeName}</div>
            <p>Estamos emocionados de tenerte en nuestro equipo. Como <strong>${role}</strong>, podrás:</p>
            <ul>
              ${
                role === "Manager"
                  ? `
                  <li>Gestionar el catálogo de productos</li>
                  <li>Visualizar reportes financieros</li>
                  <li>Invitar y gestionar empleados</li>
                  <li>Monitorear el inventario en tiempo real</li>
                `
                  : `
                  <li>Registrar entrada/salida de lotes</li>
                  <li>Consultar el inventario actual</li>
                  <li>Recibir alertas importantes</li>
                  <li>Colaborar con tu equipo</li>
                `
              }
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${acceptUrl}" class="cta-button">
              Aceptar Invitación
            </a>
          </div>

          <div class="message">
            <p>Si no puedes hacer click en el botón, copia y pega este link en tu navegador:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">
              ${acceptUrl}
            </p>
          </div>
        </div>

        <div class="footer">
          <p>Este link expirará en ${role === "Manager" ? "7 días" : "30 días"}.</p>
          <p>© 2026 Smart-Shelf. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
