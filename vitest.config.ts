import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["extensions/**/*.test.ts", "extensions/**/*.test.tsx", "remotion/**/*.test.ts"],
    exclude: ["node_modules", "remotion/node_modules"],
    environment: "node",
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
  benchmark: {
    include: ["extensions/**/*.bench.ts"],
    exclude: ["node_modules", "remotion/node_modules"],
    environment: "node",
    time: 200,
    iterations: 10,
  },
});
