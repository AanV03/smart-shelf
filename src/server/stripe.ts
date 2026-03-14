import Stripe from "stripe";
import { env } from "@/env";

/**
 * Stripe SDK instance
 * Solo disponible en servidor (usa STRIPE_SECRET_KEY)
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "");
