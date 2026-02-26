import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/auth", () => ({
  getAuthSession: jest.fn(),
}));
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    verificationToken: {
      deleteMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("$2b$12$hashedpassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

function makeRequest(body: unknown, method = "POST") {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a new user with valid data", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      createdAt: new Date(),
    });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "SecurePass1",
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.email).toBe("alice@example.com");
  });

  it("returns 409 when email already exists", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", email: "alice@example.com" });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "SecurePass1",
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("returns 400 for invalid data", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({ name: "A", email: "bad", password: "short" });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  const { prisma } = require("@/lib/prisma");

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns 200 even when user not found (anti-enumeration)", async () => {
    jest.mock("@/lib/prisma", () => ({
      prisma: {
        user: { findUnique: jest.fn().mockResolvedValue(null) },
        verificationToken: { deleteMany: jest.fn(), create: jest.fn() },
      },
    }));
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "nonexistent@example.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("If an account exists");
  });

  it("returns 400 for invalid email", async () => {
    const { POST } = await import("@/app/api/auth/forgot-password/route");
    const req = new NextRequest("http://localhost:3000/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
