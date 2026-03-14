import type { NextRequest } from "next/server";
import Stripe from "stripe";
import { env } from "@/env";
import { requireAuth, errorResponse, successResponse } from "../users/utils";

// Inicializar cliente de Stripe
const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "");

/**
 * POST /api/checkout
 * Crea una sesión de Stripe Checkout para suscripciones B2B
 * Solo disponible para usuarios con rol MANAGER
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ Validar autenticación
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;

    // ✅ Validar que el usuario tenga rol MANAGER en al menos una store
    const hasManagerRole = sessionUser.stores?.some(
      (store) => store.role === "MANAGER" && store.status === "ACTIVE"
    );

    if (!hasManagerRole) {
      console.warn("[CHECKOUT] User does not have MANAGER role", {
        userId: sessionUser.id,
        stores: sessionUser.stores,
      });
      return errorResponse(
        "Solo gerentes pueden acceder al checkout",
        403
      );
    }

    // ✅ Parsear y validar el body
    const body = await request.json() as {
      storeId?: string;
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const {
      storeId,
      priceId = "price_1QzZ1sDFoZSFZZZDj5Fmc4Q3", // Default price ID - reemplazar con el tuyo
      successUrl = `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard`,
    } = body;

    if (!storeId) {
      return errorResponse("storeId es requerido", 400);
    }

    // ✅ Validar que el usuario tenga acceso a esta store
    const hasAccessToStore = sessionUser.stores?.some(
      (store) => store.id === storeId && store.role === "MANAGER"
    );

    if (!hasAccessToStore) {
      console.warn("[CHECKOUT] User does not have access to store", {
        userId: sessionUser.id,
        storeId,
      });
      return errorResponse("No tienes acceso a esta tienda", 403);
    }

    // ✅ Crear sesión de checkout en Stripe
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

    console.log("[CHECKOUT] Session created successfully", {
      userId: sessionUser.id,
      storeId: storeId,
      sessionId: session.id,
    });

    return successResponse(
      {
        sessionId: session.id,
        url: session.url,
      },
      200
    );
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);

    if (error instanceof Error) {
      // Manejar errores específicos de Stripe
      if (error.message.includes("stripe")) {
        return errorResponse(
          "Error al procesar el pago. Por favor intenta de nuevo.",
          402
        );
      }
    }

    return errorResponse("Error interno del servidor", 500);
  }
}
