import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            provider: "v8",
            exclude: ["src/**/*.test.ts"],
            reporter: ["text", "clover"],
            reportsDirectory: "coverage",
        },
    },
});
