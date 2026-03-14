import { env } from "@/env";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Solo permitir en development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      AUTH_SECRET: env.AUTH_SECRET ? "✓ Set" : "✗ Missing",
      AUTH_DISCORD_ID: env.AUTH_DISCORD_ID
        ? `✓ ${env.AUTH_DISCORD_ID.substring(0, 10)}...`
        : "✗ Missing",
      AUTH_DISCORD_SECRET: env.AUTH_DISCORD_SECRET ? "✓ Set" : "✗ Missing",
      AUTH_GOOGLE_ID: env.AUTH_GOOGLE_ID
        ? `✓ ${env.AUTH_GOOGLE_ID.substring(0, 10)}...`
        : "✗ Missing",
      AUTH_GOOGLE_SECRET: env.AUTH_GOOGLE_SECRET ? "✓ Set" : "✗ Missing",
      DATABASE_URL: env.DATABASE_URL ? "✓ Set" : "✗ Missing",
    },
    oauth_check: {
      discord_ready: !!(env.AUTH_DISCORD_ID && env.AUTH_DISCORD_SECRET),
      google_ready: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
      credentials_always_available: true,
    },
  });
}
