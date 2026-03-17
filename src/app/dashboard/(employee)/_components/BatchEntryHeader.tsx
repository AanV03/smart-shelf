"use client";

import { useI18n } from "@/lib/i18n-client";

export function BatchEntryHeader() {
  const { t } = useI18n();

  return (
    <>
      {/* Hero section */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-foreground text-4xl font-bold tracking-tight">
            {t.batchEntry.title}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t.batchEntry.subtitle}
        </p>
      </div>

      {/* Tips section */}
      <div className="border-border/30 bg-card/50 mt-8 rounded-lg border p-6 backdrop-blur-sm">
        <h3 className="text-foreground mb-3 text-sm font-bold">
          {t.batchEntry.tipsTitle}
        </h3>
        <ul className="text-muted-foreground grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <li>
            ✓ {t.batchEntry.tipTab}
          </li>
          <li>
            ✓ {t.batchEntry.tipBarcode}
          </li>
          <li>✓ {t.batchEntry.tipValidation}</li>
          <li>✓ {t.batchEntry.tipClear}</li>
          <li>✓ {t.batchEntry.tipHistory}</li>
          <li>
            ✓ {t.batchEntry.tipEnter}
          </li>
        </ul>
      </div>
    </>
  );
}
