import { rateLimit, MAX_REQUESTS, WINDOW_MS } from "@/lib/rate-limit";

// Freeze time so we can control window behavior
const REAL_DATE_NOW = Date.now;

describe("rateLimit", () => {
  beforeEach(() => {
    // Reset the in-memory store between tests by using unique IPs
    jest.clearAllMocks();
  });

  afterAll(() => {
    Date.now = REAL_DATE_NOW;
  });

  it("allows the first request for a new IP", () => {
    const result = rateLimit("1.2.3.1");
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(MAX_REQUESTS - 1);
    expect(result.retryAfterSeconds).toBe(0);
  });

  it("decrements remaining on each request", () => {
    const ip = "1.2.3.2";
    const first = rateLimit(ip);
    const second = rateLimit(ip);
    expect(second.remaining).toBe(first.remaining - 1);
  });

  it("blocks requests after exceeding MAX_REQUESTS", () => {
    const ip = "1.2.3.3";
    // Exhaust the limit
    for (let i = 0; i < MAX_REQUESTS; i++) {
      rateLimit(ip);
    }
    const blocked = rateLimit(ip);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets counter after window expires", () => {
    const ip = "1.2.3.4";

    // Exhaust the limit
    for (let i = 0; i < MAX_REQUESTS; i++) {
      rateLimit(ip);
    }

    // Advance time past the window
    const now = Date.now();
    Date.now = () => now + WINDOW_MS + 1000;

    const result = rateLimit(ip);
    Date.now = REAL_DATE_NOW;

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(MAX_REQUESTS - 1);
  });

  it("provides a resetAt timestamp in the future", () => {
    const before = Date.now();
    const result = rateLimit("1.2.3.5");
    const after = Date.now();
    expect(result.resetAt).toBeGreaterThanOrEqual(before + WINDOW_MS - 100);
    expect(result.resetAt).toBeLessThanOrEqual(after + WINDOW_MS + 100);
  });

  it("isolates counters per IP", () => {
    const r1 = rateLimit("10.0.0.1");
    const r2 = rateLimit("10.0.0.2");
    // Both should be at MAX_REQUESTS - 1
    expect(r1.remaining).toBe(MAX_REQUESTS - 1);
    expect(r2.remaining).toBe(MAX_REQUESTS - 1);
  });

  it("exports MAX_REQUESTS as 60", () => {
    expect(MAX_REQUESTS).toBe(60);
  });

  it("exports WINDOW_MS as 60000", () => {
    expect(WINDOW_MS).toBe(60000);
  });
});
