import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";
import { requireAuth, errorResponse, successResponse } from "../users/utils";

/**
 * POST /api/checkout
 * Crea una sesión de Stripe Checkout para suscripciones B2B
 * Solo disponible para usuarios con rol ADMIN
 */
export async function POST(request: NextRequest) {
  console.log("[CHECKOUT] Request received");

  try {
    console.log("[CHECKOUT] Step 1: Checking Stripe config");

    // ✅ Validar que Stripe esté configurado
    if (!env.STRIPE_SECRET_KEY) {
      console.error("[CHECKOUT] STRIPE_SECRET_KEY not configured");
      return errorResponse("Stripe no está configurado en el servidor", 500);
    }

    console.log("[CHECKOUT] Step 2: Initializing Stripe");

    // Inicializar cliente de Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    console.log("[CHECKOUT] Step 3: Validating auth");

    // ✅ Validar autenticación
    const auth = await requireAuth();
    if (!auth.isValid) {
      console.warn("[CHECKOUT] Auth invalid");
      return auth.error;
    }

    console.log("[CHECKOUT] Step 4: Getting session user");

    const { user: sessionUser } = auth.session!;

    console.log("[CHECKOUT] Step 5: Checking ADMIN role");

    // ✅ Validar que el usuario tenga rol ADMIN en al menos una store
    const hasAdminRole = sessionUser.stores?.some(
      (store) => store.role === "ADMIN" && store.status === "ACTIVE",
    );

    if (!hasAdminRole) {
      console.warn("[CHECKOUT] User does not have ADMIN role", {
        userId: sessionUser.id,
        stores: sessionUser.stores,
      });
      return errorResponse(
        "Solo administradores pueden acceder al checkout",
        403,
      );
    }

    console.log("[CHECKOUT] Step 6: Parsing request body");

    // ✅ Parsear y validar el body
    const body = (await request.json()) as {
      storeId?: string;
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    console.log("[CHECKOUT] Body received:", {
      storeId: body.storeId,
      priceId: body.priceId,
    });

    const {
      storeId,
      priceId,
      successUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/dashboard`,
    } = body;

    if (!storeId) {
      console.warn("[CHECKOUT] storeId missing");
      return errorResponse("storeId es requerido", 400);
    }

    if (!priceId) {
      console.warn("[CHECKOUT] priceId missing");
      return errorResponse("priceId es requerido", 400);
    }

    console.log("[CHECKOUT] Step 7: Checking store access");

    // ✅ Validar que el usuario tenga acceso a esta store como ADMIN
    const hasAccessToStore = sessionUser.stores?.some(
      (store) => store.id === storeId && store.role === "ADMIN",
    );

    if (!hasAccessToStore) {
      console.warn("[CHECKOUT] User does not have access to store", {
        userId: sessionUser.id,
        storeId,
      });
      return errorResponse("No tienes acceso a esta tienda", 403);
    }

    // ✅ Crear sesión de checkout en Stripe
    console.log("[CHECKOUT] Step 8: Creating Stripe session with params:", {
      priceId,
      storeId,
      email: sessionUser.email,
      successUrl,
      cancelUrl,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: sessionUser.email ?? undefined,
      metadata: {
        userId: sessionUser.id,
        storeId: storeId,
      },
      billing_address_collection: "required",
      locale: "es",
    });

    console.log("[CHECKOUT] Step 9: Session created successfully", {
      userId: sessionUser.id,
      storeId: storeId,
      sessionId: session.id,
    });

    return successResponse(
      {
        data: {
          sessionId: session.id,
          url: session.url,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[CHECKOUT_ERROR] Exception caught");
    console.error(
      "[CHECKOUT_ERROR] Error type:",
      error instanceof Error ? "Error" : typeof error,
    );

    if (error instanceof Error) {
      console.error("[CHECKOUT_ERROR_MESSAGE]", error.message);
      console.error(
        "[CHECKOUT_ERROR] Partial stack:",
        error.message.substring(0, 500),
      );

      // Manejar errores específicos de Stripe
      if (error.message.includes("stripe") || error.message.includes("price")) {
        console.log("[CHECKOUT] Returning Stripe-specific error");
        return errorResponse(`Error de Stripe: ${error.message}`, 402);
      }
    } else {
      console.error(
        "[CHECKOUT_ERROR] Non-Error exception:",
        typeof error,
        String(error).substring(0, 200),
      );
    }

    console.log("[CHECKOUT] Returning generic 500 error");
    return errorResponse("Error interno del servidor", 500);
  }
}
