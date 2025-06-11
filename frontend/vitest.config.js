import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: "happy-dom",
        include: ["src/**/*.spec.ts", "tests/unit/**/*.spec.ts"],
        exclude: ["**/tests-examples/**", "**/tests/e2e/**"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "cobertura"],
        },
    },
});
