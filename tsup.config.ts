import { defineConfig } from "tsup";

const env = process.env.NODE_ENV;

export default defineConfig({
    target: "es2022",
    format: ["cjs", "esm"],
    outDir: "dist",
    bundle: env === "production",
    entry: ["src/**/*.ts"],
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: true,
    skipNodeModulesBundle: true,
    minify: env === "production",
});
