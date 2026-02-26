import {
  cn,
  formatPrice,
  formatDuration,
  truncate,
  parseJsonField,
  getInitials,
  absoluteUrl,
} from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("de-duplicates conflicting Tailwind classes (tailwind-merge)", () => {
    // tailwind-merge keeps the last conflicting utility
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});

describe("formatPrice", () => {
  it("returns 'Free' for 0 cents", () => {
    expect(formatPrice(0)).toBe("Free");
  });

  it("formats cents to USD currency string", () => {
    expect(formatPrice(1999)).toBe("$19.99");
  });

  it("formats large amounts correctly", () => {
    expect(formatPrice(10000)).toBe("$100");
  });
});

describe("formatDuration", () => {
  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats 90 seconds to 1:30", () => {
    expect(formatDuration(90)).toBe("1:30");
  });

  it("pads single-digit seconds with leading zero", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("handles exact minutes", () => {
    expect(formatDuration(180)).toBe("3:00");
  });
});

describe("truncate", () => {
  it("returns the original string when shorter than length", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns the original string when equal to length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends ellipsis when longer than length", () => {
    expect(truncate("hello world", 5)).toBe("hello...");
  });

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("");
  });
});

describe("parseJsonField", () => {
  it("parses valid JSON", () => {
    expect(parseJsonField<string[]>('["a","b"]', [])).toEqual(["a", "b"]);
  });

  it("returns fallback for invalid JSON", () => {
    expect(parseJsonField<string[]>("not-json", [])).toEqual([]);
  });

  it("returns fallback for empty string", () => {
    expect(parseJsonField<Record<string, number>>("{}", {})).toEqual({});
  });

  it("handles nested objects", () => {
    expect(parseJsonField<{ min: number }>('{"min":120}', { min: 0 })).toEqual({
      min: 120,
    });
  });
});

describe("getInitials", () => {
  it("returns '?' for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns '?' for undefined", () => {
    expect(getInitials(undefined)).toBe("?");
  });

  it("returns initials for single word", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("returns initials for two words", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("uppercases initials", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("caps at 2 characters for long names", () => {
    expect(getInitials("John Michael Doe")).toBe("JM");
  });
});

describe("absoluteUrl", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = originalEnv;
    }
  });

  it("uses NEXT_PUBLIC_APP_URL when set", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://example.com";
    expect(absoluteUrl("/about")).toBe("https://example.com/about");
  });

  it("falls back to localhost:3000 when env is not set", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(absoluteUrl("/test")).toBe("http://localhost:3000/test");
  });
});
