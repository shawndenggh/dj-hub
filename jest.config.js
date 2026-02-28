/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    // Map @/* imports to src/* (mirrors tsconfig paths)
    "^@/(.*)$": "<rootDir>/src/$1",
    // Stub out CSS imports (not needed in tests)
    "^.+\\.css$": "<rootDir>/src/__tests__/mocks/style.ts",
  },
  testMatch: [
    "**/__tests__/**/*.{test,spec}.{ts,tsx}",
    "**/*.{test,spec}.{ts,tsx}",
    "!**/e2e/**",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          // Relax some strict options for test code
          strict: false,
          esModuleInterop: true,
          module: "commonjs",
          jsx: "react-jsx",
        },
      },
    ],
  },
  // Ignore Next.js build output, node_modules, and e2e
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/e2e/"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  collectCoverageFrom: [
    // Core library files (well-tested)
    "src/lib/utils.ts",
    "src/lib/deezer.ts",
    "src/lib/stripe.ts",
    "src/lib/auth.ts",
    "src/lib/music-classifier.ts",
    "src/lib/validations.ts",
    "src/lib/rate-limit.ts",
    "src/lib/recommendation-engine.ts",
    // Tested components
    "src/components/track-card.tsx",
    "src/components/music-player.tsx",
    "src/components/stats-card.tsx",
    "src/components/delete-confirm-dialog.tsx",
    "src/components/pagination.tsx",
    // Tested API routes
    "src/app/api/auth/register/route.ts",
    "src/app/api/auth/forgot-password/route.ts",
    "src/app/api/channels/route.ts",
    "src/app/api/recommendations/route.ts",
    "src/app/api/preferences/route.ts",
    "src/app/api/subscriptions/route.ts",
    "src/app/api/stripe/webhook/route.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
};

module.exports = config;
