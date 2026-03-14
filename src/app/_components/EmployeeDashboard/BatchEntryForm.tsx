"use client";

import { useState } from "react";
import {
  Send,
  RotateCcw,
  Package,
  Hash,
  Layers,
  DollarSign,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCombobox } from "../shared/product-combobox";
import { ExpirationDatePicker } from "../shared/expiration-date-picker";
import { api } from "@/trpc/react";

export interface BatchEntry {
  id: string;
  product: string;
  productLabel: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  expirationDate: Date;
  timestamp: Date;
}

interface BatchEntryFormProps {
  onSuccess?: () => void;
}

// Temporary mapping: SKU -> hardcoded productId
// In production, this would come from the database
const skuToProductIdMap: Record<string, string> = {
  "sku-001": "prod-001",
  "sku-002": "prod-002",
  "sku-003": "prod-003",
  "sku-004": "prod-004",
  "sku-005": "prod-005",
  "sku-006": "prod-006",
  "sku-007": "prod-007",
  "sku-008": "prod-008",
  "sku-009": "prod-009",
  "sku-010": "prod-010",
};

// Unused in current implementation - product data comes from database
// const productMap: Record<string, string> = {
//   "sku-001": "Organic Whole Milk (1 Gal)",
//   "sku-002": "Free-Range Eggs (Dozen)",
//   "sku-003": "Greek Yogurt (32oz)",
//   "sku-004": "Sourdough Bread Loaf",
//   "sku-005": "Fresh Atlantic Salmon (1lb)",
//   "sku-006": "Baby Spinach (10oz bag)",
//   "sku-007": "Cheddar Cheese Block (8oz)",
//   "sku-008": "Ground Turkey (1lb)",
//   "sku-009": "Almond Butter (16oz)",
//   "sku-010": "Kombucha Ginger (16oz)",
// }

interface FormErrors {
  product?: string;
  batchNumber?: string;
  quantity?: string;
  unitCost?: string;
  expirationDate?: string;
  submit?: string;
}

export function BatchEntryForm({ onSuccess }: BatchEntryFormProps) {
  const [product, setProduct] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<FormErrors>({});

  const createBatchMutation = api.inventory.createBatch.useMutation({
    onSuccess: () => {
      // Reset form
      setProduct("");
      setBatchNumber("");
      setQuantity("");
      setUnitCost("");
      setExpirationDate(undefined);
      setErrors({});
      onSuccess?.();
    },
    onError: (error) => {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to create batch. Please try again.",
      }));
    },
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!product) newErrors.product = "Please select a product.";
    if (!batchNumber.trim())
      newErrors.batchNumber = "Batch number is required.";
    if (!quantity || Number(quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0.";
    if (!unitCost || Number(unitCost) <= 0)
      newErrors.unitCost = "Unit cost must be greater than 0.";
    if (!expirationDate)
      newErrors.expirationDate =
        "Expiration date is required for FEFO tracking.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const productId = skuToProductIdMap[product];
    if (!productId) {
      setErrors((prev) => ({ ...prev, product: "Invalid product selected" }));
      return;
    }

    createBatchMutation.mutate({
      productId,
      batchNumber: batchNumber.trim(),
      quantity: Number(quantity),
      costPerUnit: Number(unitCost),
      expiresAt: expirationDate!,
    });
  };

  const handleReset = () => {
    setProduct("");
    setBatchNumber("");
    setQuantity("");
    setUnitCost("");
    setExpirationDate(undefined);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Batch Entry Form"
      className="space-y-6"
    >
      {/* Product Select */}
      <div className="space-y-3">
        <Label
          htmlFor="product-select"
          className="text-foreground flex items-center gap-2 font-semibold"
        >
          <Package className="text-primary size-4" aria-hidden="true" />
          Product
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <ProductCombobox
          id="product-select"
          value={product}
          onChange={(val) => {
            setProduct(val);
            if (errors.product)
              setErrors((e) => ({ ...e, product: undefined }));
          }}
          aria-required={true}
          aria-invalid={!!errors.product}
          aria-describedby={errors.product ? "product-error" : undefined}
        />
        {errors.product && (
          <p
            id="product-error"
            role="alert"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            <AlertCircle className="h-3 w-3" /> {errors.product}
          </p>
        )}
      </div>

      {/* Batch Number */}
      <div className="space-y-3">
        <Label
          htmlFor="batch-number"
          className="text-foreground flex items-center gap-2 font-semibold"
        >
          <Hash className="text-primary size-4" aria-hidden="true" />
          Batch Number
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="batch-number"
          type="text"
          placeholder="e.g., BTH-2026-0228"
          value={batchNumber}
          onChange={(e) => {
            setBatchNumber(e.target.value);
            if (errors.batchNumber)
              setErrors((err) => ({ ...err, batchNumber: undefined }));
          }}
          aria-required={true}
          aria-invalid={!!errors.batchNumber}
          aria-describedby={errors.batchNumber ? "batch-error" : "batch-help"}
          className="border-border/30 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 focus:ring-2"
        />
        <p id="batch-help" className="text-muted-foreground text-xs">
          Unique identifier from supplier label
        </p>
        {errors.batchNumber && (
          <p
            id="batch-error"
            role="alert"
            className="text-destructive flex items-center gap-1 text-xs"
          >
            <AlertCircle className="h-3 w-3" /> {errors.batchNumber}
          </p>
        )}
      </div>

      {/* Quantity & Unit Cost row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Quantity */}
        <div className="space-y-3">
          <Label
            htmlFor="quantity"
            className="text-foreground flex items-center gap-2 font-semibold"
          >
            <Layers className="text-primary size-4" aria-hidden="true" />
            Quantity
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              if (errors.quantity)
                setErrors((err) => ({ ...err, quantity: undefined }));
            }}
            aria-required={true}
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "qty-error" : "qty-help"}
            className="border-border/30 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 focus:ring-2"
          />
          <p id="qty-help" className="text-muted-foreground text-xs">
            Number of units
          </p>
          {errors.quantity && (
            <p
              id="qty-error"
              role="alert"
              className="text-destructive flex items-center gap-1 text-xs"
            >
              <AlertCircle className="h-3 w-3" /> {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit Cost */}
        <div className="space-y-3">
          <Label
            htmlFor="unit-cost"
            className="text-foreground flex items-center gap-2 font-semibold"
          >
            <DollarSign className="text-primary size-4" aria-hidden="true" />
            Unit Cost
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium">
              $
            </span>
            <Input
              id="unit-cost"
              type="number"
              min={0.01}
              step={0.01}
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => {
                setUnitCost(e.target.value);
                if (errors.unitCost)
                  setErrors((err) => ({ ...err, unitCost: undefined }));
              }}
              aria-required={true}
              aria-invalid={!!errors.unitCost}
              aria-describedby={errors.unitCost ? "cost-error" : "cost-help"}
              className="border-border/30 bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 pl-8 focus:ring-2"
            />
          </div>
          <p id="cost-help" className="text-muted-foreground text-xs">
            Cost per unit (USD)
          </p>
          {errors.unitCost && (
            <p
              id="cost-error"
              role="alert"
              className="text-destructive flex items-center gap-1 text-xs"
            >
              <AlertCircle className="h-3 w-3" /> {errors.unitCost}
            </p>
          )}
        </div>
      </div>

      {/* Expiration Date - CRITICAL for FEFO */}
      <div className="space-y-3">
        <div className="border-warning/30 bg-warning/5 relative rounded-lg border p-4">
          <div className="bg-card text-warning absolute -top-2.5 left-3 flex items-center gap-1 px-2 text-[11px] font-bold tracking-wider uppercase">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            FEFO Critical
          </div>
          <Label
            htmlFor="expiration-date"
            className="text-foreground flex items-center gap-2 font-semibold"
          >
            Expiration Date
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <p id="exp-help" className="text-muted-foreground mb-3 text-xs">
            Controls First-Expired, First-Out shelf rotation
          </p>
          <ExpirationDatePicker
            id="expiration-date"
            value={expirationDate}
            onChange={(date) => {
              setExpirationDate(date);
              if (errors.expirationDate)
                setErrors((err) => ({ ...err, expirationDate: undefined }));
            }}
            aria-required={true}
            aria-invalid={!!errors.expirationDate}
            aria-describedby={errors.expirationDate ? "exp-error" : "exp-help"}
          />
          {errors.expirationDate && (
            <p
              id="exp-error"
              role="alert"
              className="text-destructive mt-2 flex items-center gap-1 text-xs"
            >
              <AlertCircle className="h-3 w-3" /> {errors.expirationDate}
            </p>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errors.submit && (
        <div className="border-destructive/30 bg-destructive/5 flex gap-3 rounded-lg border p-4">
          <AlertCircle
            className="text-destructive mt-0.5 size-5 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p className="text-destructive text-sm font-semibold">
              {errors.submit}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <button
          type="submit"
          disabled={createBatchMutation.isPending}
          className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground focus-visible:ring-primary focus-visible:ring-offset-background flex h-11 flex-1 items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          {createBatchMutation.isPending ? (
            <>
              <span className="border-primary-foreground/30 border-t-primary-foreground size-4 animate-spin rounded-full border-2" />
              Logging...
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Log Batch Entry
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="border-border/30 bg-secondary/50 text-muted-foreground hover:bg-secondary/70 hover:text-foreground focus-visible:ring-primary focus-visible:ring-offset-background h-11 rounded-lg border px-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only ml-2 sm:not-sr-only">Reset</span>
        </button>
      </div>
    </form>
  );
}
