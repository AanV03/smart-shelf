"use client"

import { format, differenceInDays } from "date-fns"
import { Clock, Package, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { BatchEntry } from "./batch-entry-form"

interface RecentEntriesProps {
  entries: BatchEntry[]
}

export function RecentEntries({ entries }: RecentEntriesProps) {
  const recentThree = entries.slice(-3).reverse()

  const getExpiryBadge = (date: Date) => {
    const days = differenceInDays(date, new Date())
    if (days < 0) return { label: "Expired", className: "bg-destructive/20 text-destructive border-destructive/30" }
    if (days <= 7) return { label: `${days}d left`, className: "bg-destructive/20 text-destructive border-destructive/30" }
    if (days <= 30) return { label: `${days}d left`, className: "bg-warning/20 text-warning border-warning/30" }
    return { label: `${days}d left`, className: "bg-primary/15 text-primary border-primary/30" }
  }

  return (
    <section aria-labelledby="recent-entries-heading" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="size-4 text-primary" aria-hidden="true" />
        <h2
          id="recent-entries-heading"
          className="text-sm font-semibold text-foreground"
        >
          Recent Entries
        </h2>
        {entries.length > 0 && (
          <Badge
            variant="secondary"
            className="ml-auto border border-border/60 bg-secondary/80 text-secondary-foreground"
          >
            {entries.length} today
          </Badge>
        )}
      </div>

      {recentThree.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/40 bg-secondary/20 py-12 text-center">
          <div className="rounded-full bg-secondary/50 p-3">
            <Package className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              No entries yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Logged batches will appear here
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="List of recent batch entries">
          {recentThree.map((entry, index) => {
            const expiryBadge = getExpiryBadge(entry.expirationDate)
            return (
              <li
                key={entry.id}
                className={cn(
                  "group relative rounded-lg border border-border/40 bg-secondary/25 p-4 transition-colors hover:bg-secondary/40",
                  index === 0 && "border-primary/20 bg-primary/5"
                )}
              >
                {index === 0 && (
                  <div className="absolute -top-2 right-3">
                    <Badge
                      variant="default"
                      className="bg-primary/20 text-primary border border-primary/30 text-[10px]"
                    >
                      <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
                      Latest
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {entry.productLabel}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {entry.batchNumber}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px]", expiryBadge.className)}
                  >
                    {differenceInDays(entry.expirationDate, new Date()) <= 7 && (
                      <AlertTriangle className="mr-1 size-3" aria-hidden="true" />
                    )}
                    {expiryBadge.label}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Qty: <span className="font-medium text-foreground">{entry.quantity}</span>
                  </span>
                  <span>
                    Cost: <span className="font-medium text-foreground">${entry.unitCost.toFixed(2)}</span>
                  </span>
                  <span className="ml-auto">
                    Exp: <span className="font-medium text-foreground">{format(entry.expirationDate, "MMM d")}</span>
                  </span>
                </div>

                <p className="mt-2 text-[10px] text-muted-foreground/60">
                  Logged at {format(entry.timestamp, "h:mm a")}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      {entries.length > 3 && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          + {entries.length - 3} more {entries.length - 3 === 1 ? "entry" : "entries"} today
        </p>
      )}
    </section>
  )
}
