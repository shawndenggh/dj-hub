import "@testing-library/jest-dom";

// ── Next.js Navigation mock ──────────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// ── Next.js Image mock ───────────────────────────────────────────────────────
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return require("react").createElement("img", { src, alt, ...props });
  },
}));

// ── HTMLMediaElement stub (jsdom only) ──────────────────────────────────────
if (typeof window !== "undefined") {
  // Mock HTMLMediaElement prototype methods that jsdom doesn't implement
  Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
  Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });
}

// ── Suppress console noise in tests ─────────────────────────────────────────
const originalConsoleError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0]);
    if (
      msg.includes("Warning: ReactDOM.render") ||
      msg.includes("Warning: An update to") ||
      msg.includes("not wrapped in act")
    )
      return;
    originalConsoleError(...args);
  };
});
afterAll(() => {
  console.error = originalConsoleError;
});
