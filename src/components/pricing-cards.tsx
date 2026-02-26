"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import type { PLANS } from "@/lib/stripe";

interface PricingCardsProps {
  plans: typeof PLANS;
  currentPlan: string;
  isAuthenticated: boolean;
}

export function PricingCards({ plans, currentPlan, isAuthenticated }: PricingCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubscribe(plan: string) {
    if (!isAuthenticated) {
      router.push("/register");
      return;
    }

    if (plan === "FREE") {
      router.push("/dashboard");
      return;
    }

    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
      setLoadingPlan(null);
    }
  }

  const planOrder = ["FREE", "PRO", "ENTERPRISE"] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {planOrder.map((planKey) => {
        const plan = plans[planKey];
        const isCurrent = currentPlan === planKey;
        const isPopular = planKey === "PRO";
        const isLoading = loadingPlan === planKey;

        return (
          <Card
            key={planKey}
            className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg scale-105" : ""}`}
          >
            {isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="px-3">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground ml-1">/month</span>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                  onClick={() => handleSubscribe(planKey)}
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {planKey === "FREE" ? "Get Started" : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
