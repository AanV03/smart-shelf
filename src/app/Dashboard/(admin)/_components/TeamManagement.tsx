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
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "EMPLOYEE">(
    "EMPLOYEE"
  );
  const [copied, setCopied] = useState<string | null>(null);

  const activeStore = session?.user?.stores?.[0];

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          storeId: activeStore.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json() as { message: string };
        throw new Error(data.message);
      }

      setInviteEmail("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      console.log("[INVITE_SUCCESS]", { email: inviteEmail });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al invitar";
      setError(message);
      console.error("[INVITE_ERROR]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("¿Eliminar este miembro del equipo?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar");
      setMembers(members.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestión del Equipo
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your store team members and roles
          </p>
        </div>
      </div>

      {/* Invite Dialog */}
      <Card className="border-emerald-500/20 bg-white/5 backdrop-blur-md p-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <Users className="mr-2 h-4 w-4" />
              Invitar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-950/95 border-slate-800 backdrop-blur">
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              <DialogDescription>
                Invita a nuevos miembros a tu equipo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Rol</Label>
                <select
                  id="role"
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "MANAGER" | "EMPLOYEE")
                  }
                  className="w-full mt-1 px-3 py-2 rounded-md border border-slate-700
                             bg-slate-900 text-foreground focus:border-emerald-500
                             focus:ring-1 focus:ring-emerald-500 transition-colors"
                >
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="MANAGER">Gerente</option>
                </select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </Alert>
              )}

              {success && (
                <Alert className="border-emerald-500/50 bg-emerald-500/10">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-300">Invitación enviada correctamente</span>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? "Enviando..." : "Enviar Invitación"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </Card>

      {/* Members List */}
      <Card className="border-slate-700 bg-white/5 backdrop-blur-md">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Miembros</h2>

          {members.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No hay miembros en el equipo aún
            </p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg
                             border border-slate-700 bg-white/5 hover:bg-white/10
                             transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{member.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground truncate">
                            {member.email}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(member.email, member.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100
                                      transition-opacity"
                          >
                            {copied === member.id ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <Badge
                      variant={
                        member.role === "MANAGER" ? "default" : "secondary"
                      }
                    >
                      {member.role === "MANAGER" ? "Gerente" : "Empleado"}
                    </Badge>

                    {member.status === "INVITED" && (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pendiente
                      </Badge>
                    )}

                    {member.status === "ACTIVE" && (
                      <Badge variant="outline" className="gap-1 border-emerald-500/50 text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Activo
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
