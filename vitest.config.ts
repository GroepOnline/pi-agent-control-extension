import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["extensions/**/*.test.ts", "extensions/**/*.test.tsx", "remotion/**/*.test.ts"],
    exclude: ["node_modules", "remotion/node_modules"],
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
    include: ["extensions/**/*.bench.ts"],
    exclude: ["node_modules", "remotion/node_modules"],
    environment: "node",
    time: 200,
    iterations: 10,
  },
});
