import { NextRequest } from "next/server";

// Mock stripe and prisma
jest.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
    subscriptions: {
      retrieve: jest.fn(),
    },
  },
  PLANS: {
    FREE: { limits: { channels: 5, recommendations: 50 } },
    PRO: { limits: { channels: -1, recommendations: 500 } },
    ENTERPRISE: { limits: { channels: -1, recommendations: -1 } },
  },
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.STRIPE_PRO_PRICE_ID = "price_pro";
process.env.STRIPE_ENTERPRISE_PRICE_ID = "price_enterprise";

function makeWebhookRequest(body: string, signature = "valid-sig") {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": signature,
    },
    body,
  });
}

describe("POST /api/stripe/webhook", () => {
  const { stripe } = require("@/lib/stripe");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing");
  });

  it("returns 400 when signature verification fails", async () => {
    stripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest('{"type":"test"}', "bad-sig"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("Invalid signature");
  });

  it("handles checkout.session.completed and upserts subscription", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_123",
          customer: "cus_123",
          metadata: { userId: "user-1" },
        },
      },
    });
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 9999999999,
      items: { data: [{ price: { id: "price_pro" } }] },
    });
    prisma.subscription.upsert.mockResolvedValue({});

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest(JSON.stringify({})));

    expect(res.status).toBe(200);
    expect(prisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        create: expect.objectContaining({ plan: "PRO" }),
      })
    );
  });

  it("handles invoice.payment_succeeded and updates subscription", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      data: {
        object: {
          subscription: "sub_123",
        },
      },
    });
    stripe.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      current_period_end: 9999999999,
      items: { data: [{ price: { id: "price_pro" } }] },
    });
    prisma.subscription.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest("{}"));

    expect(res.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "active", plan: "PRO" }),
      })
    );
  });

  it("handles invoice.payment_failed and marks past_due", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: { subscription: "sub_fail" } },
    });
    prisma.subscription.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest("{}"));

    expect(res.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "past_due" },
      })
    );
  });

  it("handles customer.subscription.deleted and downgrades to FREE", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_deleted" } },
    });
    prisma.subscription.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest("{}"));

    expect(res.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: "FREE", status: "canceled" }),
      })
    );
  });

  it("handles customer.subscription.updated", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_updated",
          status: "active",
          current_period_end: 9999999999,
          items: { data: [{ price: { id: "price_enterprise" } }] },
        },
      },
    });
    prisma.subscription.update.mockResolvedValue({});

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest("{}"));

    expect(res.status).toBe(200);
    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ plan: "ENTERPRISE" }),
      })
    );
  });

  it("returns 200 for unhandled event types (graceful)", async () => {
    stripe.webhooks.constructEvent.mockReturnValue({
      type: "customer.created",
      data: { object: {} },
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(makeWebhookRequest("{}"));
    expect(res.status).toBe(200);
    expect((await res.json()).received).toBe(true);
  });
});
