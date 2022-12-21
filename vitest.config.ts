import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        coverage: {
            exclude: [".pnp.*", "test/**/*.ts"],
            reporter: ["text", "clover"],
            reportsDirectory: "coverage",
        },
    },
});
