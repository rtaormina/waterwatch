import { defineConfig } from "vite";

export default defineConfig({
    test: {
    exclude: ['**/tests-examples/**', '**/tests/e2e/**']
    },
});
