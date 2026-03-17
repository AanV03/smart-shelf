import type { NextRequest } from "next/server";
import { db } from "@/server/db";
import {
  requireAuth,
  errorResponse,
  successResponse,
} from "@/app/api/users/utils";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { env } from "@/env";

/**
 * DELETE /api/stores/[storeId]/delete
 * Soft delete a store (marks as deleted but keeps data for recovery)
 * Only ADMIN of the store can delete it
 * 
 * This also cancels any active Stripe subscriptions
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  const { storeId: storeIdParam } = await params;
  try {
    console.log("[STORE_DELETE] Starting deletion request", {
      storeId: storeIdParam,
    });

    // Validate auth
    const auth = await requireAuth();
    if (!auth.isValid) {
      return auth.error;
    }

    const { user: sessionUser } = auth.session!;
    const storeId = storeIdParam;

    // Verify user is ADMIN of this store
    const hasAdminAccess = sessionUser.stores?.some(
      (store) =>
        store.id === storeId &&
        store.role === "ADMIN" &&
        store.status === "ACTIVE",
    );

    if (!hasAdminAccess) {
      console.warn("[STORE_DELETE] Unauthorized deletion attempt", {
        userId: sessionUser.id,
        storeId,
        userRole: sessionUser.stores?.find((s) => s.id === storeId)?.role,
      });
      return errorResponse(
        "Solo el administrador de la tienda puede eliminarla",
        403,
      );
    }

    // Get the store
    const store = await db.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return errorResponse("Tienda no encontrada", 404);
    }

    if (store.deletedAt) {
      console.warn("[STORE_DELETE] Attempted to delete already deleted store", {
        storeId,
        deletedAt: store.deletedAt,
      });
      return errorResponse("Esta tienda ya ha sido eliminada", 410);
    }

    console.log("[STORE_DELETE] Store verified, proceeding with deletion", {
      storeId,
      storeName: store.name,
    });

    // ✅ Step 1: Cancel Stripe subscription if exists
    if (env.STRIPE_SECRET_KEY) {
      try {
        await cancelStripeSubscription(storeId);
      } catch (stripeError) {
        console.error("[STORE_DELETE] Error canceling Stripe subscription", {
          error: stripeError,
          storeId,
        });
        // Don't throw - continue with store deletion even if Stripe cancellation fails
        // The subscription cancellation should be retried via webhook
      }
    }

    // ✅ Step 2: Soft delete the store (mark with deletedAt timestamp)
    const deletedStore = await db.store.update({
      where: { id: storeId },
      data: {
        deletedAt: new Date(),
      },
    });

    console.log("[STORE_DELETE] Store soft-deleted successfully", {
      storeId,
      deletedAt: deletedStore.deletedAt,
    });

    // ✅ Step 3: Optional - Deactivate all store members
    const deactivatedMembers = await db.storeMember.updateMany({
      where: { storeId },
      data: {
        status: "INACTIVE",
      },
    });

    console.log("[STORE_DELETE] Store members deactivated", {
      count: deactivatedMembers.count,
      storeId,
    });

    return successResponse(
      {
        message: "Tienda eliminada correctamente",
        store: {
          id: deletedStore.id,
          name: deletedStore.name,
          deletedAt: deletedStore.deletedAt,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[STORE_DELETE] Unexpected error", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return errorResponse(
      error instanceof Error ? error.message : "Error al eliminar la tienda",
      500,
    );
  }
}

/**
 * Helper: Cancel Stripe subscription for a store
 * Queries FinancialReport or metadata to find subscription ID, then cancels it
 */
async function cancelStripeSubscription(storeId: string): Promise<void> {
  if (!env.STRIPE_SECRET_KEY) {
    console.warn("[STRIPE] STRIPE_SECRET_KEY not configured");
    return;
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  try {
    console.log("[STRIPE] Looking for active subscriptions", { storeId });

    // Search for subscriptions by metadata (store_id)
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: "active",
    });

    const storeSubscriptions = subscriptions.data.filter((sub) => {
      const metadata = sub.metadata as Record<string, string>;
      return metadata?.store_id === storeId;
    });

    console.log("[STRIPE] Found subscriptions", {
      storeId,
      count: storeSubscriptions.length,
    });

    // Cancel all subscriptions for this store
    for (const subscription of storeSubscriptions) {
      console.log("[STRIPE] Canceling subscription", {
        subscriptionId: subscription.id,
        storeId,
      });

      await stripe.subscriptions.cancel(subscription.id);

      console.log("[STRIPE] Subscription canceled successfully", {
        subscriptionId: subscription.id,
        storeId,
      });
    }
  } catch (error) {
    console.error("[STRIPE] Error canceling subscription", {
      error,
      storeId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    throw error;
  }
}
