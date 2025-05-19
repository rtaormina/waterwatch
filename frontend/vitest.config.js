import { defineConfig } from "vite";

export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts", "tests/unit/**/*.spec.ts"],
    exclude: ["**/tests-examples/**", "**/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "cobertura"],
    },
  },
});
