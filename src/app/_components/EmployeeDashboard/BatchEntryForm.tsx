"use client"

import { useState } from "react"
import { Send, RotateCcw, Package, Hash, Layers, DollarSign, CalendarDays } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProductCombobox } from "../shared/product-combobox"
import { ExpirationDatePicker } from "../shared/expiration-date-picker"

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
  onSubmit: (entry: BatchEntry) => void
}

const productMap: Record<string, string> = {
  "sku-001": "Organic Whole Milk (1 Gal)",
  "sku-002": "Free-Range Eggs (Dozen)",
  "sku-003": "Greek Yogurt (32oz)",
  "sku-004": "Sourdough Bread Loaf",
  "sku-005": "Fresh Atlantic Salmon (1lb)",
  "sku-006": "Baby Spinach (10oz bag)",
  "sku-007": "Cheddar Cheese Block (8oz)",
  "sku-008": "Ground Turkey (1lb)",
  "sku-009": "Almond Butter (16oz)",
  "sku-010": "Kombucha Ginger (16oz)",
}

interface FormErrors {
  product?: string
  batchNumber?: string
  quantity?: string
  unitCost?: string
  expirationDate?: string
}

export function BatchEntryForm({ onSubmit }: BatchEntryFormProps) {
  const [product, setProduct] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>()
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    setIsSubmitting(true)
    // Simulate async submission
    await new Promise((resolve) => setTimeout(resolve, 600))

    onSubmit({
      id: crypto.randomUUID(),
      product,
      productLabel: productMap[product] ?? product,
      batchNumber: batchNumber.trim(),
      quantity: Number(quantity),
      unitCost: Number(unitCost),
      expirationDate: expirationDate!,
      timestamp: new Date(),
    })

    // Reset form
    setProduct("")
    setBatchNumber("")
    setQuantity("")
    setUnitCost("")
    setExpirationDate(undefined)
    setErrors({})
    setIsSubmitting(false)
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

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {isSubmitting ? (
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
