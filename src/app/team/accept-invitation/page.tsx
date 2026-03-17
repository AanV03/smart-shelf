"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n-client";

function AcceptInvitationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationDetails, setInvitationDetails] = useState<{
    storeName: string;
    role: string;
  } | null>(null);

  const token = params.get("token");

  // Auto-accept if authenticated
  useEffect(() => {
    if (status === "authenticated" && token && !loading && !success) {
      void handleAcceptInvitation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, token]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      setError(t.team.invitations.notFound);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/team/accept-invitation?token=${token}`,
      );

      if (!response.ok) {
        const data = (await response.json()) as { message: string };
        throw new Error(data.message);
      }

      const data = (await response.json()) as {
        data: {
          message: string;
          store: { id: string; name: string };
          role: string;
        };
      };

      setInvitationDetails({
        storeName: data.data.store.name,
        role:
          data.data.role === "MANAGER"
            ? t.team.invitations.managerRole
            : data.data.role === "ADMIN"
              ? t.team.invitations.adminRole
              : t.team.invitations.employeeRole,
      });
      setSuccess(true);

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        void router.push("/dashboard");
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      console.error("[ACCEPT_INVITATION_CLIENT]", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-white/5 p-8 backdrop-blur-md">
        {!token ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="text-destructive h-12 w-12" />
            </div>
            <h1 className="text-foreground text-center text-2xl font-bold">
              {t.team.invitations.invalidLink}
            </h1>
            <p className="text-muted-foreground text-center">
              {t.team.invitations.invalidLinkDescription}
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {t.team.invitations.returnHome}
            </Button>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-4 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-emerald-500" />
            <p className="text-muted-foreground">{t.team.invitations.loading}</p>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="space-y-4">
            <h1 className="text-foreground text-2xl font-bold">
              {t.team.invitations.acceptTitle}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t.team.invitations.acceptDescription}
            </p>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-600">
                {t.team.invitations.loginRequired}
              </span>
            </Alert>

            <Button
              onClick={() => signIn("credentials", { redirect: false })}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {t.auth.signIn}
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push("/auth/register")}
              className="text-foreground w-full border-slate-700 hover:bg-white/10"
            >
              {t.auth.signUp}
            </Button>
          </div>
        ) : success && invitationDetails ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <h1 className="text-foreground text-center text-2xl font-bold">
              {t.team.invitations.welcomeTitle}
            </h1>
            <div className="space-y-2 text-center">
              <p className="text-muted-foreground text-sm">
                {t.team.invitations.addedAs}
              </p>
              <p className="font-semibold text-emerald-400">
                {invitationDetails.role}
              </p>
              <p className="text-muted-foreground text-sm">
                {t.team.invitations.inStore}{" "}
                <span className="text-foreground font-semibold">
                  {invitationDetails.storeName}
                </span>
              </p>
            </div>
            <p className="text-muted-foreground text-center text-xs">
              {t.team.invitations.redirecting}
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="text-destructive h-12 w-12" />
            </div>
            <h1 className="text-foreground text-center text-2xl font-bold">
              {t.team.invitations.error}
            </h1>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
            <Button
              onClick={() => router.push("/")}
              className="w-full bg-slate-700 hover:bg-slate-600"
            >
              {t.team.invitations.returnHome}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
