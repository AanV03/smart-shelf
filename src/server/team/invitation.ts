import { randomBytes } from "crypto";

/**
 * Generate a cryptographically secure random token
 */
export function generateInvitationToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate invitation accept URL
 */
export function generateInvitationUrl(
  token: string,
  baseUrl: string = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
): string {
  return `${baseUrl}/team/accept-invitation?token=${token}`;
}
