"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, CreditCard, Zap, Crown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n-client";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

const PLAN_IDS = {
  starter: "starter",
  pro: "pro",
  enterprise: "enterprise",
};

const PLAN_PRICES = {
  starter: {
    monthlyPriceId: "price_1TAiPPQrR30p4EpS54xmUqJF",
    yearlyPriceId: "price_1TAiSPQrR30p4EpSgJx7Iom3",
    monthlyPrice: 29,
    yearlyPrice: 290,
  },
  pro: {
    monthlyPriceId: "price_1TAiQ2QrR30p4EpSQc6L8MNa",
    yearlyPriceId: "price_1TAiStQrR30p4EpSZICeWEOy",
    monthlyPrice: 79,
    yearlyPrice: 790,
  },
  enterprise: {
    monthlyPriceId: "price_1TAiRAQrR30p4EpSbYkYYlk2",
    yearlyPriceId: "price_1TAiTPQrR30p4EpS0MMdg2Bp",
    monthlyPrice: 299,
    yearlyPrice: 2990,
  },
};

export function PlansSelection() {
  const { data: session } = useSession();
  const { t } = useI18n();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const activeStore = session?.user?.stores?.[0];

  // Build plans dynamically with translations
  const PLANS: Plan[] = [
    {
      id: "starter",
      name: t.plans.starter.name,
      description: t.plans.starter.description,
      ...PLAN_PRICES.starter,
      features: [
        t.plans.starter.feature1,
        t.plans.starter.feature2,
        t.plans.starter.feature3,
        t.plans.starter.feature4,
        t.plans.starter.feature5,
      ],
      icon: <Zap className="h-6 w-6" />,
    },
    {
      id: "pro",
      name: t.plans.professional.name,
      description: t.plans.professional.description,
      ...PLAN_PRICES.pro,
      features: [
        t.plans.professional.feature1,
        t.plans.professional.feature2,
        t.plans.professional.feature3,
        t.plans.professional.feature4,
        t.plans.professional.feature5,
        t.plans.professional.feature6,
        t.plans.professional.feature7,
      ],
      icon: <Crown className="h-6 w-6" />,
      popular: true,
    },
    {
      id: "enterprise",
      name: t.plans.enterprise.name,
      description: t.plans.enterprise.description,
      ...PLAN_PRICES.enterprise,
      features: [
        t.plans.enterprise.feature1,
        t.plans.enterprise.feature2,
        t.plans.enterprise.feature3,
        t.plans.enterprise.feature4,
        t.plans.enterprise.feature5,
        t.plans.enterprise.feature6,
        t.plans.enterprise.feature7,
        t.plans.enterprise.feature8,
        t.plans.enterprise.feature9,
      ],
      icon: <Crown className="h-6 w-6" />,
    },
  ];

  const handleSelectPlan = async (plan: Plan) => {
    if (!activeStore) {
      setError("No active store found");
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedPlan(plan.id);

    try {
      // Select the correct priceId based on billing period
      const priceId =
        billingPeriod === "monthly" ? plan.monthlyPriceId : plan.yearlyPriceId;

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: activeStore.id,
          priceId,
          planName: plan.name,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message: string };
        throw new Error(data.message);
      }

      const data = (await response.json()) as { data: { url: string } };
      if (data.data.url) {
        window.location.href = data.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar";
      setError(message);
      console.error("[PLAN_SELECT_ERROR]", err);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-foreground flex items-center gap-2 text-3xl font-bold">
          <CreditCard className="h-8 w-8" />
          {t.plans.title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.plans.subtitle}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </Alert>
      )}

      {/* Billing Toggle */}
      <Card className="border-slate-700 bg-white/5 p-4 backdrop-blur-md">
        <div className="flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium transition-colors ${
              billingPeriod === "monthly"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t.plans.monthly}
          </span>
          <button
            onClick={() =>
              setBillingPeriod(
                billingPeriod === "monthly" ? "yearly" : "monthly",
              )
            }
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="Toggle billing period"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingPeriod === "yearly" ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${
              billingPeriod === "yearly"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t.plans.yearly} <span className="text-emerald-400">{t.plans.savesMonths}</span>
          </span>
        </div>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative border backdrop-blur-md transition-all duration-300 ${
              plan.popular
                ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-white/5 ring-1 ring-emerald-500/20"
                : "border-slate-700 bg-white/5 hover:border-slate-600 hover:bg-white/10"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 hover:bg-emerald-700">
                {t.plans.popular}
              </Badge>
            )}

            <div className="space-y-6 p-6">
              {/* Plan Header */}
              <div>
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-foreground text-2xl font-bold">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-emerald-400">{plan.icon}</div>
                </div>
              </div>

              {/* Pricing */}
              <div className="rounded-lg border-t border-b border-slate-700 bg-white/5 px-4 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-foreground text-4xl font-bold">
                    $
                    {billingPeriod === "monthly"
                      ? plan.monthlyPrice
                      : plan.yearlyPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {billingPeriod === "monthly" ? t.plans.perMonth : t.plans.perYear}
                  </span>
                </div>
                {billingPeriod === "yearly" && (
                  <p className="mt-2 text-xs text-emerald-400">
                    {t.plans.savingText.replace("${amount}", (plan.monthlyPrice * 2).toFixed(0))}
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-foreground text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={loading && selectedPlan === plan.id}
                className={`w-full ${
                  plan.popular
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-slate-700 hover:bg-slate-600"
                } font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading && selectedPlan === plan.id ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {t.plans.processingButton}
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    {t.plans.selectButton}
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Box */}
      <Card className="border-slate-700 bg-blue-500/5 p-6 backdrop-blur-md">
        <h3 className="text-foreground mb-2 font-semibold">
          {t.plans.helpTitle}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t.plans.helpText}
        </p>
      </Card>
    </div>
  );
}
