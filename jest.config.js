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
    "src/lib/**/*.{ts,tsx}",
    // Individual components that have tests
    "src/components/track-card.tsx",
    "src/components/music-player.tsx",
    "src/components/stats-card.tsx",
    "src/components/delete-confirm-dialog.tsx",
    "src/components/pagination.tsx",
    // API routes
    "src/app/api/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/lib/prisma.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
  coverageReporters: ["text", "lcov", "html"],
};

module.exports = config;
