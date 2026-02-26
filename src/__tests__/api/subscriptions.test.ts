import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: jest.fn() },
  },
}));
jest.mock("@/lib/stripe", () => ({
  stripe: {},
  PLANS: {
    FREE: {
      name: "Free",
      price: 0,
      priceId: null,
      features: [],
      limits: { channels: 5, recommendations: 50 },
    },
    PRO: {
      name: "Pro",
      price: 1999,
      limits: { channels: -1, recommendations: 500 },
    },
    ENTERPRISE: {
      name: "Enterprise",
      price: 9999,
      limits: { channels: -1, recommendations: -1 },
    },
  },
}));

const mockSession = {
  user: { id: "user-1", name: "Alice", email: "alice@example.com" },
};

describe("GET /api/subscriptions", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/subscriptions/route");
    const res = await GET(new NextRequest("http://localhost/api/subscriptions"));
    expect(res.status).toBe(401);
  });

  it("returns null when no subscription found", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/subscriptions/route");
    const res = await GET(new NextRequest("http://localhost/api/subscriptions"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeNull();
  });

  it("returns subscription with plan details", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      plan: "PRO",
      status: "active",
    });

    const { GET } = await import("@/app/api/subscriptions/route");
    const res = await GET(new NextRequest("http://localhost/api/subscriptions"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.plan).toBe("PRO");
    expect(json.data.planDetails).toBeDefined();
    expect(json.data.planDetails.name).toBe("Pro");
  });

  it("returns FREE plan details when plan is FREE", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      plan: "FREE",
      status: "active",
    });

    const { GET } = await import("@/app/api/subscriptions/route");
    const res = await GET(new NextRequest("http://localhost/api/subscriptions"));
    const json = await res.json();

    expect(json.data.planDetails.price).toBe(0);
    expect(json.data.planDetails.limits.channels).toBe(5);
  });

  it("handles internal server error gracefully", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockRejectedValue(new Error("DB error"));

    const { GET } = await import("@/app/api/subscriptions/route");
    const res = await GET(new NextRequest("http://localhost/api/subscriptions"));
    expect(res.status).toBe(500);
  });
});
