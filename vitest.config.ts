import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "packages/**/*.test.ts", "packages/**/*.test.tsx", "apps/**/*.test.ts"],
    exclude: ["node_modules", "apps/remotion/node_modules"],
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 50,
        branches: 40,
        functions: 50,
        lines: 50,
      },
    },
  },
  benchmark: {
    include: ["packages/**/*.bench.ts"],
    exclude: ["node_modules", "apps/remotion/node_modules"],
    environment: "node",
    time: 200,
    iterations: 10,
  },
});
