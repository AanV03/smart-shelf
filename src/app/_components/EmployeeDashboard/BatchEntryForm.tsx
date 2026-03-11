"use client"

import { useState } from "react"
import { Send, RotateCcw, Package, Hash, Layers, DollarSign, CalendarDays, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductCombobox } from "../shared/product-combobox"
import { ExpirationDatePicker } from "../shared/expiration-date-picker"
import { api } from "@/trpc/react"

export interface BatchEntry {
  id: string
  product: string
  productLabel: string
  batchNumber: string
  quantity: number
  unitCost: number
  expirationDate: Date
  timestamp: Date
}

interface BatchEntryFormProps {
  onSuccess?: () => void
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
}

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
  product?: string
  batchNumber?: string
  quantity?: string
  unitCost?: string
  expirationDate?: string
  submit?: string
}

export function BatchEntryForm({ onSuccess }: BatchEntryFormProps) {
  const [product, setProduct] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [errors, setErrors] = useState<FormErrors>({})
  
  const createBatchMutation = api.inventory.createBatch.useMutation({
    onSuccess: () => {
      // Reset form
      setProduct("")
      setBatchNumber("")
      setQuantity("")
      setUnitCost("")
      setExpirationDate(undefined)
      setErrors({})
      onSuccess?.()
    },
    onError: (error) => {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Failed to create batch. Please try again.",
      }))
    },
  })

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!product) newErrors.product = "Please select a product."
    if (!batchNumber.trim()) newErrors.batchNumber = "Batch number is required."
    if (!quantity || Number(quantity) <= 0)
      newErrors.quantity = "Quantity must be greater than 0."
    if (!unitCost || Number(unitCost) <= 0)
      newErrors.unitCost = "Unit cost must be greater than 0."
    if (!expirationDate)
      newErrors.expirationDate = "Expiration date is required for FEFO tracking."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const productId = skuToProductIdMap[product]
    if (!productId) {
      setErrors((prev) => ({ ...prev, product: "Invalid product selected" }))
      return
    }

    createBatchMutation.mutate({
      productId,
      batchNumber: batchNumber.trim(),
      quantity: Number(quantity),
      costPerUnit: Number(unitCost),
      expiresAt: expirationDate!,
    })
  }

  const handleReset = () => {
    setProduct("")
    setBatchNumber("")
    setQuantity("")
    setUnitCost("")
    setExpirationDate(undefined)
    setErrors({})
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Batch Entry Form"
      className="space-y-6"
    >
      {/* Product Select */}
      <div className="space-y-2">
        <Label
          htmlFor="product-select"
          className="flex items-center gap-2 text-foreground"
        >
          <Package className="size-3.5 text-primary" aria-hidden="true" />
          Product
          <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <ProductCombobox
          id="product-select"
          value={product}
          onChange={(val) => {
            setProduct(val)
            if (errors.product) setErrors((e) => ({ ...e, product: undefined }))
          }}
          aria-required={true}
          aria-invalid={!!errors.product}
          aria-describedby={errors.product ? "product-error" : undefined}
        />
        {errors.product && (
          <p id="product-error" role="alert" className="text-xs text-destructive">
            {errors.product}
          </p>
        )}
      </div>

      {/* Batch Number */}
      <div className="space-y-2">
        <Label
          htmlFor="batch-number"
          className="flex items-center gap-2 text-foreground"
        >
          <Hash className="size-3.5 text-primary" aria-hidden="true" />
          Batch Number
          <span className="text-destructive" aria-hidden="true">*</span>
        </Label>
        <Input
          id="batch-number"
          type="text"
          placeholder="e.g., BTH-2026-0228"
          value={batchNumber}
          onChange={(e) => {
            setBatchNumber(e.target.value)
            if (errors.batchNumber)
              setErrors((err) => ({ ...err, batchNumber: undefined }))
          }}
          aria-required={true}
          aria-invalid={!!errors.batchNumber}
          aria-describedby={
            errors.batchNumber ? "batch-error" : "batch-help"
          }
          className="h-10 border-border/60 bg-secondary/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <p id="batch-help" className="text-[11px] text-muted-foreground">
          Unique identifier from the supplier shipment label
        </p>
        {errors.batchNumber && (
          <p id="batch-error" role="alert" className="text-xs text-destructive">
            {errors.batchNumber}
          </p>
        )}
      </div>

      {/* Quantity & Unit Cost row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Quantity */}
        <div className="space-y-2">
          <Label
            htmlFor="quantity"
            className="flex items-center gap-2 text-foreground"
          >
            <Layers className="size-3.5 text-primary" aria-hidden="true" />
            Quantity
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            step={1}
            placeholder="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value)
              if (errors.quantity)
                setErrors((err) => ({ ...err, quantity: undefined }))
            }}
            aria-required={true}
            aria-invalid={!!errors.quantity}
            aria-describedby={errors.quantity ? "qty-error" : "qty-help"}
            className="h-10 border-border/60 bg-secondary/40 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
          <p id="qty-help" className="text-[11px] text-muted-foreground">
            Number of units in this batch
          </p>
          {errors.quantity && (
            <p id="qty-error" role="alert" className="text-xs text-destructive">
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Unit Cost */}
        <div className="space-y-2">
          <Label
            htmlFor="unit-cost"
            className="flex items-center gap-2 text-foreground"
          >
            <DollarSign className="size-3.5 text-primary" aria-hidden="true" />
            Unit Cost
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                setUnitCost(e.target.value)
                if (errors.unitCost)
                  setErrors((err) => ({ ...err, unitCost: undefined }))
              }}
              aria-required={true}
              aria-invalid={!!errors.unitCost}
              aria-describedby={errors.unitCost ? "cost-error" : "cost-help"}
              className="h-10 border-border/60 bg-secondary/40 pl-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
          </div>
          <p id="cost-help" className="text-[11px] text-muted-foreground">
            Cost per unit in USD
          </p>
          {errors.unitCost && (
            <p id="cost-error" role="alert" className="text-xs text-destructive">
              {errors.unitCost}
            </p>
          )}
        </div>
      </div>

      {/* Expiration Date - CRITICAL for FEFO */}
      <div className="space-y-2">
        <div className="relative rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="absolute -top-2.5 left-3 flex items-center gap-1 bg-card px-2 text-[10px] font-semibold uppercase tracking-wider text-warning">
            <CalendarDays className="size-3" aria-hidden="true" />
            FEFO Critical
          </div>
          <Label
            htmlFor="expiration-date"
            className="flex items-center gap-2 text-foreground"
          >
            Expiration Date
            <span className="text-destructive" aria-hidden="true">*</span>
          </Label>
          <p id="exp-help" className="mb-3 text-[11px] text-muted-foreground">
            Critical for First-Expired, First-Out shelf rotation
          </p>
          <ExpirationDatePicker
            id="expiration-date"
            value={expirationDate}
            onChange={(date) => {
              setExpirationDate(date)
              if (errors.expirationDate)
                setErrors((err) => ({ ...err, expirationDate: undefined }))
            }}
            aria-required={true}
            aria-invalid={!!errors.expirationDate}
            aria-describedby={
              errors.expirationDate ? "exp-error" : "exp-help"
            }
          />
          {errors.expirationDate && (
            <p
              id="exp-error"
              role="alert"
              className="mt-1.5 text-xs text-destructive"
            >
              {errors.expirationDate}
            </p>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errors.submit && (
        <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-destructive">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={createBatchMutation.isPending}
          className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {createBatchMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              Logging...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="size-4" aria-hidden="true" />
              Log Batch Entry
            </span>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="h-11 border-border/60 text-muted-foreground hover:bg-secondary/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Reset</span>
        </Button>
      </div>
    </form>
  )
}
