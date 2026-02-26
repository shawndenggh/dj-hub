import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: { findUnique: jest.fn() },
    recommendation: {
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    preference: { findUnique: jest.fn() },
  },
}));
jest.mock("@/lib/deezer", () => ({
  getRecommendations: jest.fn(),
}));
jest.mock("@/lib/recommendation-engine", () => ({
  scoreAndRankTracks: jest.fn(),
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

describe("GET /api/recommendations", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");
  const { getRecommendations } = require("@/lib/deezer");
  const { scoreAndRankTracks } = require("@/lib/recommendation-engine");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/recommendations/route");
    const res = await GET(new NextRequest("http://localhost/api/recommendations"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when monthly limit reached", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({ plan: "FREE" });
    prisma.recommendation.count.mockResolvedValue(50); // FREE limit

    const { GET } = await import("@/app/api/recommendations/route");
    const res = await GET(new NextRequest("http://localhost/api/recommendations"));

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("LIMIT_REACHED");
  });

  it("returns recommendations for authenticated user", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.subscription.findUnique.mockResolvedValue({ plan: "PRO" });
    prisma.preference.findUnique.mockResolvedValue({
      genres: '["House"]',
      bpm: '{"min":120,"max":130}',
      excludeExplicit: false,
    });
    prisma.recommendation.findMany.mockResolvedValue([]);
    prisma.recommendation.create.mockResolvedValue({});

    const mockTrack = {
      id: 1,
      title: "House Anthem",
      artist: { id: 10, name: "DJ" },
      album: { id: 20, title: "Album" },
      bpm: 126,
      duration: 200,
      preview: "https://cdn.deezer.com/preview/1.mp3",
      explicit_lyrics: false,
    };
    getRecommendations.mockResolvedValue([mockTrack]);
    scoreAndRankTracks.mockReturnValue([{ track: mockTrack, score: 75, factors: {} }]);

    const { GET } = await import("@/app/api/recommendations/route");
    const res = await GET(new NextRequest("http://localhost/api/recommendations?limit=5"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
  });
});

describe("POST /api/recommendations (feedback)", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { POST } = await import("@/app/api/recommendations/route");
    const res = await POST(
      new NextRequest("http://localhost/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: "rec-1", liked: true }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing fields", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    const { POST } = await import("@/app/api/recommendations/route");
    const res = await POST(
      new NextRequest("http://localhost/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: "rec-1" }), // missing liked
      })
    );
    expect(res.status).toBe(400);
  });

  it("saves feedback and returns updated recommendation", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.recommendation.findFirst.mockResolvedValue({ id: "rec-1", userId: "user-1" });
    prisma.recommendation.update.mockResolvedValue({ id: "rec-1", liked: true });

    const { POST } = await import("@/app/api/recommendations/route");
    const res = await POST(
      new NextRequest("http://localhost/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: "rec-1", liked: true }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Feedback saved");
  });

  it("returns 404 when recommendation not found", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.recommendation.findFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/recommendations/route");
    const res = await POST(
      new NextRequest("http://localhost/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: "nonexistent", liked: false }),
      })
    );
    expect(res.status).toBe(404);
  });
});
