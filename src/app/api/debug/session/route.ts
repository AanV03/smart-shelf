import { getServerAuthSession } from "@/server/auth";
import { db } from "@/server/db";

export async function GET() {
  try {
    const session = await getServerAuthSession();

    console.log("[DEBUG_SESSION] Current session:", {
      exists: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      stores: session?.user?.stores,
    });

    if (session?.user?.id) {
      // Verificar en database
      const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, status: true },
      });

      console.log("[DEBUG_SESSION] User in database:", user);

      // Verificar store members en database
      const storeMembers = await db.storeMember.findMany({
        where: { userId: session.user.id },
        include: {
          store: {
            select: { id: true, name: true },
          },
        },
      });

      console.log("[DEBUG_SESSION] Store memberships in database:", {
        count: storeMembers.length,
        memberships: storeMembers,
      });

      // Verificar sesiones en database
      const dbSessions = await db.session.findMany({
        where: { userId: session.user.id },
        select: { id: true, sessionToken: true, expires: true, userId: true },
      });

      console.log("[DEBUG_SESSION] Sessions in database:", {
        count: dbSessions.length,
        sessions: dbSessions,
      });

      return Response.json({
        status: "authenticated",
        session,
        user,
        storeMembers,
        dbSessions: dbSessions.length,
      });
    }

    return Response.json({
      status: "unauthenticated",
      session: null,
    });
  } catch (error) {
    console.error("[DEBUG_SESSION] Error:", error);
    return Response.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
