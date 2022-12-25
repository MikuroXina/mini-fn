import { defineConfig } from "tsup";

const env = process.env.NODE_ENV;

export default defineConfig({
    target: "es2022",
    format: ["cjs", "esm"],
    outDir: "dist",
    bundle: env === "production",
    entry: ["src/**/*.ts", "!src/**/*.test.ts"],
    treeshake: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: true,
    skipNodeModulesBundle: true,
    minify: env === "production",
});
