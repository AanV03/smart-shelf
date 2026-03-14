import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface AccountStatusCardProps {
  status?: string;
  emailVerified?: Date | null;
  createdAt?: Date;
}

export function AccountStatusCard({
  status,
  emailVerified,
  createdAt,
}: AccountStatusCardProps) {
  return (
    <Card>
      <CardHeader className="px-4 sm:px-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
          Estado de Cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:space-y-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Estado
          </span>
          <Badge variant="default" className="text-xs">
            Activo
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Email Verificado
          </span>
          <Badge
            variant={emailVerified ? "default" : "destructive"}
            className="text-xs"
          >
            {emailVerified ? "Verificado" : "Pendiente"}
          </Badge>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs sm:text-sm">
            Miembro desde
          </span>
          <span className="text-right text-xs font-medium sm:text-sm">
            {createdAt
              ? new Date(createdAt).toLocaleDateString("es-CO", {
                  month: "long",
                  year: "numeric",
                })
              : "Desconocido"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
