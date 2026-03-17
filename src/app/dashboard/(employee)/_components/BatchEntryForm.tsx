"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { Package, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n-client";
import { api } from "@/trpc/react";

interface BatchEntryFormProps {
  onSuccess?: () => void;
}

export function BatchEntryForm({ onSuccess }: BatchEntryFormProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    productId: "",
    batchNumber: "",
    quantity: "",
    costPerUnit: "",
    expiresAt: format(new Date(), "yyyy-MM-dd"),
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const batchNumberInputRef = useRef<HTMLInputElement>(null);

  // Fetch productos disponibles para el autocomplete
  const { data: products = [], isLoading: productsLoading } =
    api.inventory.getProducts.useQuery();

  // Mutation crear batch
  const { mutate: createBatch, isPending } =
    api.inventory.createBatch.useMutation({
      onSuccess: () => {
        setSuccess(true);
        setError(null);

        // Reset form
        setFormData({
          productId: "",
          batchNumber: "",
          quantity: "",
          costPerUnit: "",
          expiresAt: format(new Date(), "yyyy-MM-dd"),
        });

        // Auto-focus batch number input para siguiente entrada
        setTimeout(() => {
          batchNumberInputRef.current?.focus();
          setSuccess(false);
        }, 1500);

        onSuccess?.();
      },
      onError: (err) => {
        setError(err.message || t.batchEntryForm.createError);
        setSuccess(false);
      },
    });

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, productId: e.target.value });
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData,
  ) => {
    const value = e.target.value;
    setFormData({ ...formData, [field]: value });
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab para siguiente campo
    // Enter en el último campo para submit
    if (e.key === "Enter" && e.currentTarget === batchNumberInputRef.current) {
      // Permitir enter sin submit para que fluya al siguiente campo
      // Se controla con el form submission normal
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.productId) {
      setError(t.batchEntryForm.selectProduct);
      return;
    }
    if (!formData.batchNumber.trim()) {
      setError("Ingresa el número de lote");
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError(t.batchEntryForm.invalidQuantity);
      return;
    }
    if (!formData.costPerUnit || parseFloat(formData.costPerUnit) <= 0) {
      setError(t.batchEntryForm.invalidCostPerUnit);
      return;
    }

    createBatch({
      productId: formData.productId,
      batchNumber: formData.batchNumber.trim(),
      quantity: parseInt(formData.quantity),
      costPerUnit: parseFloat(formData.costPerUnit),
      expiresAt: new Date(formData.expiresAt),
    });
  };

  return (
    <Card className="border-border/50 from-card to-card/80 bg-linear-to-br backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="text-primary h-5 w-5" />
          {t.batchEntryForm.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border-destructive/30 flex items-center gap-3 rounded-lg border px-4 py-3">
              <AlertCircle className="text-destructive h-5 w-5 flex-shrink-0" />
              <p className="text-destructive text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="bg-primary/10 border-primary/30 flex items-center gap-3 rounded-lg border px-4 py-3">
              <CheckCircle2 className="text-primary h-5 w-5 flex-shrink-0" />
              <p className="text-primary text-sm font-medium">
                {t.batchEntryForm.successMessage}
              </p>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-2">
            <Label htmlFor="product" className="text-sm font-medium">
              {t.batchEntryForm.productLabel}
            </Label>
            <select
              id="product"
              value={formData.productId}
              onChange={handleProductChange}
              disabled={productsLoading || isPending}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              aria-required="true"
              aria-invalid={!!error && !formData.productId}
            >
              <option value="">
                {productsLoading ? t.batchEntryForm.loading : t.batchEntryForm.selectProduct}
              </option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.sku} - {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="batch-number" className="text-sm font-medium">
              {t.batchEntryForm.batchNumberLabel}
            </Label>
            <Input
              ref={batchNumberInputRef}
              id="batch-number"
              type="text"
              placeholder={t.batchEntryForm.batchNumberPlaceholder}
              value={formData.batchNumber}
              onChange={(e) => handleInputChange(e, "batchNumber")}
              onKeyDown={handleKeyDown}
              disabled={isPending}
              aria-required="true"
              aria-invalid={!!error && !formData.batchNumber}
              autoFocus
            />
          </div>

          {/* Grid: Cantidad, Costo, Fecha */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                {t.batchEntryForm.quantityLabel}
              </Label>
              <Input
                id="quantity"
                type="number"
                placeholder={t.batchEntryForm.quantityPlaceholder}
                value={formData.quantity}
                onChange={(e) => handleInputChange(e, "quantity")}
                disabled={isPending}
                aria-required="true"
                aria-invalid={!!error && !formData.quantity}
              />
            </div>

            {/* Cost Per Unit */}
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-sm font-medium">
                {t.batchEntryForm.costPerUnitLabel}
              </Label>
              <Input
                id="cost"
                type="number"
                placeholder={t.batchEntryForm.costPerUnitPlaceholder}
                value={formData.costPerUnit}
                onChange={(e) => handleInputChange(e, "costPerUnit")}
                disabled={isPending}
                step="0.01"
                aria-required="true"
                aria-invalid={!!error && !formData.costPerUnit}
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label htmlFor="expires-at" className="text-sm font-medium">
                {t.batchEntryForm.expirationDateLabel}
              </Label>
              <Input
                id="expires-at"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => handleInputChange(e, "expiresAt")}
                disabled={isPending}
                aria-required="true"
              />
            </div>
          </div>

          {/* Total Cost Display */}
          {formData.quantity && formData.costPerUnit && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground text-sm">Costo Total:</p>
              <p className="text-foreground text-lg font-bold tabular-nums">
                $
                {(
                  parseFloat(formData.quantity || "0") *
                  parseFloat(formData.costPerUnit || "0")
                ).toFixed(2)}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending}
            className="h-10 w-full font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando lote...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Registrar Lote
              </>
            )}
          </Button>

          {/* Keyboard Shortcuts Hint */}
          <p className="text-muted-foreground pt-2 text-center text-xs">
            💡 Presiona <kbd className="bg-muted rounded px-2 py-1">Tab</kbd>{" "}
            para navegar entre campos •{" "}
            <kbd className="bg-muted rounded px-2 py-1">Enter</kbd> para enviar
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
