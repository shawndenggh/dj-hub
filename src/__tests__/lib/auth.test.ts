import { getAuthSession, requireAuth } from "@/lib/auth";

// Mock next-auth and Prisma adapter (ESM modules need manual mocking)
jest.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: jest.fn(() => ({})),
}));

// Mock next-auth
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    preference: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const { getServerSession } = require("next-auth");

describe("getAuthSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns session when authenticated", async () => {
    const mockSession = {
      user: { id: "user-1", name: "Alice", email: "alice@example.com", role: "USER" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
    getServerSession.mockResolvedValue(mockSession);

    const session = await getAuthSession();
    expect(session).toEqual(mockSession);
  });

  it("returns null when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);

    const session = await getAuthSession();
    expect(session).toBeNull();
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns session when authenticated", async () => {
    const mockSession = {
      user: { id: "user-1", name: "Alice", email: "alice@example.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
    getServerSession.mockResolvedValue(mockSession);

    const session = await requireAuth();
    expect(session.user.id).toBe("user-1");
  });

  it("throws Unauthorized error when not authenticated", async () => {
    getServerSession.mockResolvedValue(null);

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });

  it("throws when session has no user", async () => {
    getServerSession.mockResolvedValue({ expires: "soon" });

    await expect(requireAuth()).rejects.toThrow("Unauthorized");
  });
});

describe("authOptions callbacks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("authOptions is defined with correct shape", () => {
    // Import dynamically to avoid Prisma adapter issues in test env
    const { authOptions } = require("@/lib/auth");
    expect(authOptions.session?.strategy).toBe("jwt");
    expect(authOptions.pages?.signIn).toBe("/login");
    expect(authOptions.providers).toBeDefined();
    expect(Array.isArray(authOptions.providers)).toBe(true);
    expect(authOptions.providers.length).toBeGreaterThan(0);
  });

  it("jwt callback appends id and role to token", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.user.findUnique.mockResolvedValue({ role: "ADMIN" });

    const { authOptions } = require("@/lib/auth");
    const jwtCallback = authOptions.callbacks?.jwt;
    if (!jwtCallback) return;

    const token = await jwtCallback({
      token: {},
      user: { id: "user-1", email: "a@b.com" },
    });

    expect(token.id).toBe("user-1");
    expect(token.role).toBe("ADMIN");
  });

  it("session callback copies id and role from token", async () => {
    const { authOptions } = require("@/lib/auth");
    const sessionCallback = authOptions.callbacks?.session;
    if (!sessionCallback) return;

    const result = await sessionCallback({
      session: { user: {}, expires: "" },
      token: { id: "user-2", role: "USER" },
    });

    expect(result.user.id).toBe("user-2");
    expect(result.user.role).toBe("USER");
  });

  it("signIn callback creates subscription and preference for new GitHub user", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.subscription.findUnique.mockResolvedValue(null);
    prisma.preference.findUnique.mockResolvedValue(null);
    prisma.subscription.create.mockResolvedValue({});
    prisma.preference.create.mockResolvedValue({});

    const { authOptions } = require("@/lib/auth");
    const signInCallback = authOptions.callbacks?.signIn;
    if (!signInCallback) return;

    const result = await signInCallback({
      user: { id: "user-new", email: "new@example.com" },
      account: { provider: "github" },
    });

    expect(result).toBe(true);
    expect(prisma.subscription.create).toHaveBeenCalled();
    expect(prisma.preference.create).toHaveBeenCalled();
  });

  it("signIn callback skips creation when subscription already exists", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.subscription.findUnique.mockResolvedValue({ id: "sub-1" });
    prisma.preference.findUnique.mockResolvedValue({ id: "pref-1" });

    const { authOptions } = require("@/lib/auth");
    const signInCallback = authOptions.callbacks?.signIn;
    if (!signInCallback) return;

    await signInCallback({
      user: { id: "user-existing" },
      account: { provider: "github" },
    });

    expect(prisma.subscription.create).not.toHaveBeenCalled();
    expect(prisma.preference.create).not.toHaveBeenCalled();
  });
});
