import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            exclude: ["src/**/*.test.ts"],
            reporter: ["text", "clover"],
            reportsDirectory: "coverage",
        },
    },
});
