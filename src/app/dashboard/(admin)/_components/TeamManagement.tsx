"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Mail,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n-client";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE" | "INVITED";
  joinedAt: string;
}

export function TeamManagement() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "EMPLOYEE">(
    "EMPLOYEE",
  );
  const [copied, setCopied] = useState<string | null>(null);

  const activeStore = session?.user?.stores?.[0];

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    setLoading(true);
    setError(null);

    try {
      console.log("[INVITE_START] Inviting member", {
        email: inviteEmail,
        storeId: activeStore.id,
      });

      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          storeId: activeStore.id,
        }),
      });

      console.log("[INVITE_RESPONSE]", {
        status: response.status,
        statusText: response.statusText,
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        const errorMessage = data.message ?? data.error ?? t.errors.unknown;
        throw new Error(errorMessage);
      }

      setInviteEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      console.log("[INVITE_SUCCESS]", { email: inviteEmail, data });
    } catch (err) {
      const message = err instanceof Error ? err.message : t.errors.unknown;
      setError(message);
      console.error("[INVITE_ERROR]", {
        error: err,
        message,
        email: inviteEmail,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm(t.team.confirmRemove)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(t.errors.unknown);
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.unknown);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/20 text-purple-300";
      case "MANAGER":
        return "bg-blue-500/20 text-blue-300";
      case "EMPLOYEE":
        return "bg-slate-500/20 text-slate-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-500/20 text-emerald-300";
      case "INVITED":
        return "bg-amber-500/20 text-amber-300";
      case "INACTIVE":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-foreground flex items-center gap-2 text-3xl font-bold">
          <Users className="h-8 w-8" />
          {t.team.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.team.members}
        </p>
      </div>

      {/* Invite Card */}
      <Card className="border-slate-700 bg-white/5 p-6 backdrop-blur-md">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          {t.team.invite}
        </h2>

        <form onSubmit={handleInviteMember} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </Alert>
          )}

          {success && (
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-300">
                {t.team.inviteSent}
              </span>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Email Input */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="invite-email" className="text-foreground">
                {t.team.inviteEmail}
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setError(null);
                }}
                className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={loading}
              />
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <Label htmlFor="invite-role" className="text-foreground">
                {t.team.selectRole}
              </Label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as "MANAGER" | "EMPLOYEE")
                }
                className="text-foreground border-slate-700 bg-slate-900/50 focus:border-emerald-500 focus:ring-emerald-500 flex h-9 w-full rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                <option value="EMPLOYEE">{t.team.roleEmployee}</option>
                <option value="MANAGER">{t.team.roleManager}</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !inviteEmail}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.actions.loading}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {t.team.invite}
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Members List */}
      <Card className="border-slate-700 bg-white/5 p-6 backdrop-blur-md">
        <h2 className="text-foreground mb-4 text-xl font-semibold">
          {t.team.members}
        </h2>

        {members.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t.team.noMembers}
          </p>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/30 p-4"
              >
                <div className="flex-1">
                  <p className="text-foreground font-medium">
                    {member.name || member.email}
                  </p>
                  <p className="text-muted-foreground text-sm">{member.email}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {t.roles[member.role.toLowerCase() as keyof typeof t.roles]}
                    </Badge>
                    <Badge className={getStatusBadgeColor(member.status)}>
                      {member.status === "ACTIVE"
                        ? t.team.active
                        : member.status === "INACTIVE"
                          ? t.team.inactive
                          : t.team.invited}
                    </Badge>
                  </div>
                </div>

                {member.status === "INVITED" && (
                  <Clock className="mr-4 h-5 w-5 text-amber-500" />
                )}

                {activeStore?.role === "ADMIN" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
