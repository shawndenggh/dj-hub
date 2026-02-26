import { PLANS, createStripeCustomer, createCheckoutSession, createBillingPortalSession } from "@/lib/stripe";

// Mock the stripe module
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: "cus_test", email: "test@example.com" }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: "cs_test", url: "https://checkout.stripe.com/cs_test" }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ id: "bps_test", url: "https://billing.stripe.com/bps_test" }),
      },
    },
  }));
});

describe("PLANS", () => {
  it("defines FREE plan with price 0", () => {
    expect(PLANS.FREE.price).toBe(0);
    expect(PLANS.FREE.priceId).toBeNull();
  });

  it("defines PRO plan with correct price", () => {
    expect(PLANS.PRO.price).toBe(1999);
    expect(PLANS.PRO.limits.channels).toBe(-1);
    expect(PLANS.PRO.limits.recommendations).toBe(500);
  });

  it("defines ENTERPRISE plan with unlimited features", () => {
    expect(PLANS.ENTERPRISE.price).toBe(9999);
    expect(PLANS.ENTERPRISE.limits.channels).toBe(-1);
    expect(PLANS.ENTERPRISE.limits.recommendations).toBe(-1);
  });

  it("FREE plan has limited channels", () => {
    expect(PLANS.FREE.limits.channels).toBe(5);
    expect(PLANS.FREE.limits.recommendations).toBe(50);
  });

  it("all plans have name, description, features", () => {
    for (const plan of Object.values(PLANS)) {
      expect(plan.name).toBeTruthy();
      expect(plan.description).toBeTruthy();
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});

describe("createStripeCustomer", () => {
  it("creates a customer with email and name", async () => {
    const result = await createStripeCustomer("test@example.com", "Test User");
    expect(result).toHaveProperty("id");
    expect(result.id).toBe("cus_test");
  });

  it("creates a customer with email only", async () => {
    const result = await createStripeCustomer("noname@example.com");
    expect(result).toHaveProperty("id");
  });
});

describe("createCheckoutSession", () => {
  it("creates a checkout session with required params", async () => {
    const result = await createCheckoutSession({
      customerId: "cus_test",
      priceId: "price_test",
      userId: "user-1",
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    });
    expect(result).toHaveProperty("id");
    expect(result.id).toBe("cs_test");
  });
});

describe("createBillingPortalSession", () => {
  it("creates a billing portal session", async () => {
    const result = await createBillingPortalSession("cus_test", "https://example.com/settings");
    expect(result).toHaveProperty("url");
  });
});
