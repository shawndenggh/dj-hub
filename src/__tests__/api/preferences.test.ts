import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    preference: { findUnique: jest.fn(), upsert: jest.fn() },
  },
}));

const mockSession = {
  user: { id: "user-1", name: "Alice", email: "alice@example.com" },
};

const mockPreference = {
  id: "pref-1",
  userId: "user-1",
  genres: '["House","Trance"]',
  bpm: '{"min":120,"max":140}',
  energy: '{"min":0.3,"max":0.9}',
  danceability: '{"min":0,"max":1}',
  excludeExplicit: false,
  language: "any",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("GET /api/preferences", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { GET } = await import("@/app/api/preferences/route");
    const res = await GET(new NextRequest("http://localhost/api/preferences"));
    expect(res.status).toBe(401);
  });

  it("returns preferences with parsed JSON fields", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.preference.findUnique.mockResolvedValue(mockPreference);

    const { GET } = await import("@/app/api/preferences/route");
    const res = await GET(new NextRequest("http://localhost/api/preferences"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.genres).toEqual(["House", "Trance"]);
    expect(json.data.bpm).toEqual({ min: 120, max: 140 });
  });

  it("returns null when no preferences found", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.preference.findUnique.mockResolvedValue(null);

    const { GET } = await import("@/app/api/preferences/route");
    const res = await GET(new NextRequest("http://localhost/api/preferences"));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toBeNull();
  });
});

describe("PUT /api/preferences", () => {
  const { getAuthSession } = require("@/lib/auth");
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    getAuthSession.mockResolvedValue(null);
    const { PUT } = await import("@/app/api/preferences/route");
    const res = await PUT(
      new NextRequest("http://localhost/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(401);
  });

  it("saves preferences and returns parsed data", async () => {
    getAuthSession.mockResolvedValue(mockSession);
    prisma.preference.upsert.mockResolvedValue(mockPreference);

    const { PUT } = await import("@/app/api/preferences/route");
    const res = await PUT(
      new NextRequest("http://localhost/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genres: ["House", "Trance"],
          bpm: { min: 120, max: 140 },
          energy: { min: 0.3, max: 0.9 },
          danceability: { min: 0, max: 1 },
          excludeExplicit: false,
          language: "any",
        }),
      })
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.message).toBe("Preferences saved");
  });

  it("returns 400 for invalid preference data", async () => {
    getAuthSession.mockResolvedValue(mockSession);

    const { PUT } = await import("@/app/api/preferences/route");
    const res = await PUT(
      new NextRequest("http://localhost/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bpm: { min: 10, max: 300 } }), // out of range
      })
    );

    expect(res.status).toBe(400);
  });
});
