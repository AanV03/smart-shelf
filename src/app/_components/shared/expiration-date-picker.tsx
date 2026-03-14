"use client";

import { format, differenceInDays } from "date-fns";
import { CalendarDays, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ExpirationDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  id: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function ExpirationDatePicker({
  value,
  onChange,
  id,
  ...ariaProps
}: ExpirationDatePickerProps) {
  const today = new Date();
  const daysUntilExpiry = value ? differenceInDays(value, today) : null;

  const getExpiryStatus = () => {
    if (daysUntilExpiry === null) return null;
    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 7) return "critical";
    if (daysUntilExpiry <= 30) return "warning";
    return "safe";
  };

  const expiryStatus = getExpiryStatus();

  return (
    <div className="flex flex-col gap-1.5">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className={cn(
              "border-border/60 bg-secondary/40 text-foreground hover:bg-secondary/70 hover:text-foreground focus-visible:ring-offset-background h-10 w-full justify-start text-left font-normal focus-visible:ring-2 focus-visible:ring-offset-2",
              !value && "text-muted-foreground",
              expiryStatus === "critical" &&
                "border-destructive/50 focus-visible:ring-destructive",
              expiryStatus === "warning" &&
                "border-warning/50 focus-visible:ring-warning",
              expiryStatus === "expired" &&
                "border-destructive/80 bg-destructive/10 focus-visible:ring-destructive",
            )}
            {...ariaProps}
          >
            <CalendarDays
              className={cn(
                "mr-2 size-4",
                expiryStatus === "critical" || expiryStatus === "expired"
                  ? "text-destructive"
                  : expiryStatus === "warning"
                    ? "text-warning"
                    : "text-muted-foreground",
              )}
              aria-hidden="true"
            />
            {value ? format(value, "PPP") : "Select expiration date..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border/60 bg-card w-auto p-0"
          align="start"
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Expiry status indicator */}
      {expiryStatus && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
            expiryStatus === "safe" && "bg-primary/10 text-primary",
            expiryStatus === "warning" && "bg-warning/15 text-warning",
            expiryStatus === "critical" && "bg-destructive/15 text-destructive",
            expiryStatus === "expired" && "bg-destructive/20 text-destructive",
          )}
        >
          {(expiryStatus === "critical" || expiryStatus === "expired") && (
            <AlertTriangle className="size-3.5" aria-hidden="true" />
          )}
          {expiryStatus === "expired" && "Product has already expired!"}
          {expiryStatus === "critical" &&
            `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} - FEFO Priority: HIGH`}
          {expiryStatus === "warning" &&
            `Expires in ${daysUntilExpiry} days - FEFO Priority: Medium`}
          {expiryStatus === "safe" &&
            `Expires in ${daysUntilExpiry} days - Shelf life is good`}
        </div>
      )}
    </div>
  );
}
