"use client";

import { useI18n } from "@/lib/i18n-client";

export function AnalyticsHeader() {
  const { t } = useI18n();

  return (
    <>
      {/* Hero section */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-foreground text-4xl font-bold tracking-tight">
            {t.analytics.title}
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t.analytics.subtitle}
        </p>
      </div>

      {/* Footer educational section */}
      <div className="border-border/30 bg-card/50 mt-8 rounded-lg border p-6 backdrop-blur-sm">
        <h3 className="text-foreground mb-3 text-sm font-bold">
          {t.analytics.usageTitle}
        </h3>
        <div className="text-muted-foreground grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-foreground mb-1 font-semibold">
              {t.analytics.totalInventoryValue}
            </p>
            <p>{t.analytics.totalInventoryValueDesc}</p>
          </div>
          <div>
            <p className="text-foreground mb-1 font-semibold">
              {t.analytics.expirationTrend}
            </p>
            <p>{t.analytics.expirationTrendDesc}</p>
          </div>
          <div>
            <p className="text-foreground mb-1 font-semibold">
              {t.analytics.categoryDistribution}
            </p>
            <p>{t.analytics.categoryDistributionDesc}</p>
          </div>
          <div>
            <p className="text-foreground mb-1 font-semibold">
              {t.analytics.criticalAlerts}
            </p>
            <p>{t.analytics.criticalAlertsDesc}</p>
          </div>
        </div>
      </div>
    </>
  );
}
