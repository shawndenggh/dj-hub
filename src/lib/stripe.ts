import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export const PLANS = {
  FREE: {
    name: "Free",
    description: "Perfect for hobby DJs just getting started",
    price: 0,
    priceId: null,
    features: [
      "5 channels",
      "50 recommendations/month",
      "Basic music preferences",
      "Community access",
    ],
    limits: {
      channels: 5,
      recommendations: 50,
    },
  },
  PRO: {
    name: "Pro",
    description: "For professional DJs who need more power",
    price: 1999, // cents
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "Unlimited channels",
      "500 recommendations/month",
      "Advanced music preferences",
      "Deezer integration",
      "Export playlists",
      "Priority support",
    ],
    limits: {
      channels: -1, // unlimited
      recommendations: 500,
    },
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "For labels, venues, and power users",
    price: 9999, // cents
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Everything in Pro",
      "Unlimited recommendations",
      "Custom branding",
      "API access",
      "Dedicated support",
      "Team collaboration",
    ],
    limits: {
      channels: -1,
      recommendations: -1,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

export async function createStripeCustomer(email: string, name?: string) {
  return stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { source: "dj-hub" },
  });
}

export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });
}

export async function createBillingPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
