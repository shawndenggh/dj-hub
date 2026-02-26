import type { Metadata } from "next";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLANS } from "@/lib/stripe";
import { PricingCards } from "@/components/pricing-cards";
import Link from "next/link";
import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing - DJ Hub",
  description: "Choose the plan that fits your DJ workflow",
};

export default async function PricingPage() {
  const session = await getAuthSession();

  let currentPlan = "FREE";
  if (session?.user) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });
    currentPlan = subscription?.plan ?? "FREE";
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">DJ Hub</span>
          </Link>
          {session?.user ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Pricing */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. Cancel anytime.
          </p>
        </div>

        <PricingCards
          plans={PLANS}
          currentPlan={currentPlan}
          isAuthenticated={!!session?.user}
        />
      </div>
    </div>
  );
}
