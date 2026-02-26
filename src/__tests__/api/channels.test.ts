import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    channel: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
    },
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

function makeReq(url: string, method: string, body?: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("GET /api/channels", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/channels/route");
    const res = await GET(makeReq("http://localhost/api/channels", "GET"));
    expect(res.status).toBe(401);
  });

  it("returns paginated channels for authenticated user", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.channel.findMany.mockResolvedValue([
      { id: "ch-1", name: "House Vibes", _count: { tracks: 5 } },
    ]);
    prisma.channel.count.mockResolvedValue(1);

    const { GET } = await import("@/app/api/channels/route");
    const res = await GET(makeReq("http://localhost/api/channels?page=1&limit=10", "GET"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.total).toBe(1);
  });
});

describe("POST /api/channels", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/channels/route");
    const res = await POST(makeReq("http://localhost/api/channels", "POST", { name: "Test" }));
    expect(res.status).toBe(401);
  });

  it("creates a channel when under limit", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({ plan: "PRO" });
    prisma.channel.create.mockResolvedValue({
      id: "ch-new",
      name: "New Channel",
      userId: "user-1",
    });

    const { POST } = await import("@/app/api/channels/route");
    const res = await POST(
      makeReq("http://localhost/api/channels", "POST", {
        name: "New Channel",
        isPublic: false,
      })
    );
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.name).toBe("New Channel");
  });

  it("returns 403 when channel limit reached (FREE plan)", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({ plan: "FREE" });
    prisma.channel.count.mockResolvedValue(5); // FREE limit is 5

    const { POST } = await import("@/app/api/channels/route");
    const res = await POST(
      makeReq("http://localhost/api/channels", "POST", {
        name: "One Too Many",
        isPublic: false,
      })
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("LIMIT_REACHED");
  });

  it("returns 400 for invalid channel data", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({ plan: "PRO" });

    const { POST } = await import("@/app/api/channels/route");
    const res = await POST(
      makeReq("http://localhost/api/channels", "POST", { name: "" })
    );

    expect(res.status).toBe(400);
  });
});
