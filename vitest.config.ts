import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/**/*.test.ts",
      "apps/web/**/*.test.ts",
      "apps/worker/**/*.test.ts",
      "tests/**/*.test.ts",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@clipname/shared": path.resolve(__dirname, "./packages/shared/src/index.ts"),
      "@": path.resolve(__dirname, "./apps/web"),
    },
  },
});
