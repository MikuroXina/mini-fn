import { build, emptyDir } from "https://deno.land/x/dnt@0.38.1/mod.ts";

await emptyDir("./npm");

await build({
    entryPoints: ["./mod.ts"],
    outDir: "./npm",
    shims: {
        deno: true,
    },
    typeCheck: false,
    test: false,
    package: {
        name: "@mikuroxina/mini-fn",
        version: Deno.args[0],
        description: "The minimal functional programming library.",
        license: "Apache-2.0",
        repository: {
            type: "git",
            url: "git+https://github.com/MikuroXina/mini-fn.git",
        },
        homepage: "https://mikuroxina.github.io/mini-fn/",
        bugs: {
            url: "https://github.com/MikuroXina/mini-fn/issues",
        },
        sideEffects: false,
    },
    postBuild() {
        Deno.copyFileSync("LICENSE", "npm/LICENSE");
        Deno.copyFileSync("README.md", "npm/README.md");
    },
});
