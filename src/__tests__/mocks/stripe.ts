// ── Stripe mock helpers ───────────────────────────────────────────────────────

export const mockStripeCustomer = {
  id: "cus_mock123",
  email: "test@example.com",
  object: "customer" as const,
};

export const mockCheckoutSession = {
  id: "cs_mock123",
  url: "https://checkout.stripe.com/pay/cs_mock123",
  object: "checkout.session" as const,
  mode: "subscription" as const,
};

export const mockBillingPortalSession = {
  id: "bps_mock123",
  url: "https://billing.stripe.com/session/bps_mock123",
  object: "billing_portal.session" as const,
};

export const mockStripeModule = {
  customers: {
    create: jest.fn().mockResolvedValue(mockStripeCustomer),
  },
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue(mockCheckoutSession),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn().mockResolvedValue(mockBillingPortalSession),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn().mockResolvedValue({
      id: "sub_mock123",
      status: "active",
      current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      items: { data: [{ price: { id: "price_pro_mock" } }] },
    }),
  },
};
