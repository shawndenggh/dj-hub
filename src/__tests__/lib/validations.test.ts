import {
  registerSchema,
  loginSchema,
  preferenceSchema,
  channelSchema,
  updateUserSchema,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "SecurePass1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "a@example.com",
      password: "SecurePass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "not-an-email",
      password: "SecurePass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toBeDefined();
    }
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Short1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase letter", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "nouppercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without a number", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "NoNumbers!",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "alice@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "bad", password: "pass" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("preferenceSchema", () => {
  it("accepts full valid preference", () => {
    const result = preferenceSchema.safeParse({
      genres: ["House", "Trance"],
      bpm: { min: 120, max: 140 },
      energy: { min: 0.3, max: 0.9 },
      danceability: { min: 0.4, max: 0.8 },
      excludeExplicit: true,
      language: "en",
    });
    expect(result.success).toBe(true);
  });

  it("applies defaults when fields are missing", () => {
    const result = preferenceSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.genres).toEqual([]);
      expect(result.data.excludeExplicit).toBe(false);
      expect(result.data.language).toBe("any");
      expect(result.data.bpm).toEqual({ min: 120, max: 160 });
    }
  });

  it("rejects BPM out of range (below 60)", () => {
    const result = preferenceSchema.safeParse({
      bpm: { min: 40, max: 140 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects BPM out of range (above 200)", () => {
    const result = preferenceSchema.safeParse({
      bpm: { min: 120, max: 220 },
    });
    expect(result.success).toBe(false);
  });

  it("rejects energy values outside 0-1", () => {
    const result = preferenceSchema.safeParse({
      energy: { min: -0.1, max: 1 },
    });
    expect(result.success).toBe(false);
  });
});

describe("channelSchema", () => {
  it("accepts valid channel data", () => {
    const result = channelSchema.safeParse({
      name: "My Channel",
      description: "A test channel",
      genre: "House",
      isPublic: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty channel name", () => {
    const result = channelSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects channel name longer than 50 characters", () => {
    const result = channelSchema.safeParse({ name: "a".repeat(51) });
    expect(result.success).toBe(false);
  });

  it("rejects description longer than 200 characters", () => {
    const result = channelSchema.safeParse({
      name: "Channel",
      description: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("defaults isPublic to false", () => {
    const result = channelSchema.safeParse({ name: "Channel" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });
});

describe("updateUserSchema", () => {
  it("accepts valid update data", () => {
    const result = updateUserSchema.safeParse({
      name: "Bob",
      image: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts partial update (name only)", () => {
    const result = updateUserSchema.safeParse({ name: "Bob" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid image URL", () => {
    const result = updateUserSchema.safeParse({ image: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = updateUserSchema.safeParse({ name: "X" });
    expect(result.success).toBe(false);
  });
});
