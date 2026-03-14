"use client";

import { format, differenceInDays } from "date-fns";
import {
  Clock,
  Package,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/api/root";

type Batch =
  inferRouterOutputs<AppRouter>["inventory"]["getBatches"]["batches"][0];

interface RecentEntriesProps {
  batches: Batch[];
  isLoading?: boolean;
}

export function RecentEntries({ batches, isLoading }: RecentEntriesProps) {
  const recentThree = batches.slice(-3).reverse();

  const getExpiryBadge = (date: Date) => {
    const days = differenceInDays(date, new Date());
    if (days < 0)
      return {
        label: "Expired",
        className: "bg-destructive/20 text-destructive border-destructive/30",
      };
    if (days <= 7)
      return {
        label: `${days}d left`,
        className: "bg-destructive/20 text-destructive border-destructive/30",
      };
    if (days <= 30)
      return {
        label: `${days}d left`,
        className: "bg-warning/20 text-warning border-warning/30",
      };
    return {
      label: `${days}d left`,
      className: "bg-primary/15 text-primary border-primary/30",
    };
  };

  return (
    <section aria-labelledby="recent-entries-heading" className="h-full">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="text-primary size-4" aria-hidden="true" />
        <h2
          id="recent-entries-heading"
          className="text-foreground font-semibold"
        >
          Recent Entries
        </h2>
        {batches.length > 0 && (
          <div className="bg-primary/15 border-primary/30 ml-auto rounded-lg border px-2 py-1">
            <span className="text-primary text-xs font-semibold">
              {batches.length} today
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-12">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-xs">Loading batches...</span>
        </div>
      ) : recentThree.length === 0 ? (
        <div className="border-border/40 bg-secondary/20 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
          <div className="bg-secondary/50 rounded-full p-3">
            <Package
              className="text-muted-foreground size-6"
              aria-hidden="true"
            />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium">
              No entries yet
            </p>
            <p className="text-muted-foreground/70 text-xs">
              Logged batches will appear here
            </p>
          </div>
        </div>
      ) : (
        <ul className="space-y-3" aria-label="List of recent batch entries">
          {recentThree.map((batch, index) => {
            const expiryBadge = getExpiryBadge(batch.expiresAt);
            return (
              <li
                key={batch.id}
                className={cn(
                  "group border-border/40 bg-secondary/25 hover:bg-secondary/40 hover:border-border/60 relative rounded-lg border p-4 transition-all",
                  index === 0 && "border-primary/20 bg-primary/5",
                )}
              >
                {index === 0 && (
                  <div className="bg-card text-primary border-primary/30 absolute -top-2 right-3 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold">
                    <CheckCircle2 className="size-3" />
                    Latest
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-semibold">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */}
                        {(batch as any).product?.name ?? "Unknown Product"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Batch #{batch.batchNumber}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0", expiryBadge.className)}
                    >
                      {expiryBadge.label}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <span>{batch.quantity} units</span>
                    <span className="text-border/50">•</span>
                    <span>${batch.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
