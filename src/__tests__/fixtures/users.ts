// ── User fixtures ────────────────────────────────────────────────────────────

export const mockUser = {
  id: "user-1",
  name: "Alice DJ",
  email: "alice@example.com",
  password: "$2b$12$hashedpassword",
  image: "https://example.com/avatar.jpg",
  emailVerified: new Date("2024-01-01"),
  role: "USER",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockAdminUser = {
  ...mockUser,
  id: "user-admin",
  name: "Admin User",
  email: "admin@example.com",
  role: "ADMIN",
};

export const mockSession = {
  user: {
    id: "user-1",
    name: "Alice DJ",
    email: "alice@example.com",
    image: "https://example.com/avatar.jpg",
    role: "USER",
  },
  expires: new Date(Date.now() + 86400000).toISOString(),
};

export const mockSubscription = {
  id: "sub-1",
  userId: "user-1",
  plan: "FREE" as const,
  status: "active",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  stripePriceId: null,
  stripeCurrentPeriodEnd: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

export const mockProSubscription = {
  ...mockSubscription,
  plan: "PRO" as const,
  stripeCustomerId: "cus_test123",
  stripeSubscriptionId: "sub_test123",
};
