"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Alert } from "@/components/ui/alert";
import { useI18n } from "@/lib/i18n-client";

interface DeleteStoreModalProps {
  storeName: string;
  storeId: string;
  onDeleteSuccess?: () => void;
}

export function DeleteStoreModal({
  storeName,
  storeId,
  onDeleteSuccess,
}: DeleteStoreModalProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);

    // Validate confirmation
    if (confirmName !== storeName) {
      setError(
        t.settings.confirmDeleteMismatch.replace("{storeName}", storeName),
      );
      return;
    }

    setIsDeleting(true);

    try {
      console.log("[DELETE_STORE] Initiating store deletion", { storeId });

      const response = await fetch(`/api/stores/${storeId}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      console.log("[DELETE_STORE] Response received", {
        status: response.status,
        statusText: response.statusText,
      });

      const data = (await response.json()) as {
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        const errorMessage =
          data.message ?? data.error ?? t.settings.deleteError;
        throw new Error(errorMessage);
      }

      console.log("[DELETE_STORE] Store deleted successfully", { storeId });

      setIsOpen(false);
      setConfirmName("");

      // Show success message and redirect/refresh
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Optionally redirect after a short delay
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t.errors.unknown;
      setError(message);
      console.error("[DELETE_STORE] Error", {
        error: err,
        message,
        storeId,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmName === storeName;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full">
          <Trash2 className="mr-2 h-4 w-4" />
          {t.settings.deleteStore}
        </Button>
      </DialogTrigger>

      <DialogContent className="border-destructive/30 bg-gradient-to-br from-destructive/10 via-destructive/5 to-background/50 backdrop-blur-3xl sm:max-w-md">
        {/* Glasmorphic background effect */}
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-tr from-red-500/5 via-transparent to-purple-500/5" />

        <div className="relative z-10">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {t.settings.deleteStore}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm text-muted-foreground">
                  {t.settings.deleteWarning}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <Alert className="border-destructive/50 bg-destructive/5 text-destructive">
              <div className="space-y-2">
                <p className="font-semibold">⚠️ {t.settings.deleteWarning}:</p>
                <ul className="list-inside space-y-1 text-sm">
                  {t.settings.deleteWarningDetails.map((detail, idx) => (
                    <li key={idx}>• {detail}</li>
                  ))}
                </ul>
              </div>
            </Alert>

            {error && (
              <Alert variant="destructive" className="bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <span className="ml-2 text-sm">{error}</span>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="store-confirm" className="text-sm font-semibold">
                {t.settings.confirmDelete}
              </Label>
              <Input
                id="store-confirm"
                type="text"
                placeholder={`Ej: ${storeName}`}
                value={confirmName}
                onChange={(e) => {
                  setConfirmName(e.target.value);
                  setError(null); // Clear error when user starts typing
                }}
                className="border-destructive/30 bg-destructive/5 text-foreground placeholder:text-muted-foreground focus:border-destructive focus:ring-destructive"
                disabled={isDeleting}
              />
              <p className="text-xs text-muted-foreground">
                {t.settings.exacteName}{" "}
                <span className="font-mono font-semibold text-foreground">
                  {storeName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setConfirmName("");
                setError(null);
              }}
              disabled={isDeleting}
              className="flex-1"
            >
              {t.actions.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              className="flex-1"
            >
              {isDeleting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.settings.deleting}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t.settings.deleteConfirmButton}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
