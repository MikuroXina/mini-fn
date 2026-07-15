import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["mod.ts"],
  format: "esm",
  dts: {
    compilerOptions: {
      ignoreDeprecations: "6.0",
    },
  },
});
