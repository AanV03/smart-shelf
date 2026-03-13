import { auth } from "@/server/auth";
import { NextResponse } from "next/server";

/**
 * Verifica que el usuario esté autenticado
 * Retorna la sesión del usuario o un error 401
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      isValid: false,
      error: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return {
    isValid: true,
    session,
  };
}

/**
 * Verifica que el usuario no esté suspendido o eliminado
 */
export function validateUserStatus(status: string | undefined): boolean {
  return status === "ACTIVE";
}

/**
 * Respuesta de error genérica
 */
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

/**
 * Respuesta exitosa
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}
