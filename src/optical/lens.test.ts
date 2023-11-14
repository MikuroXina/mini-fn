import { assertEquals } from "std/assert/mod.ts";
import { opticCat } from "../optical.ts";
import { key, nth } from "./lens.ts";

Deno.test("deep structure", () => {
    const hoge = {
        a: 0,
        fuga: {
            b: "hoge",
            piyo: [42],
        },
    };

    assertEquals(
        opticCat(hoge).feed(key("fuga")).feed(key("piyo")).feed(nth(0))
            .unwrap(),
        42,
    );
    assertEquals(
        opticCat(hoge).feed(key("fuga")).feed(key("piyo")).feed(nth(0)).set(31),
        {
            a: 0,
            fuga: {
                b: "hoge",
                piyo: [31],
            },
        },
    );
});

Deno.test("modify only x", () => {
    const coord = { x: 2.5, y: 3 };
    assertEquals(
        opticCat(coord)
            .feed(key("x"))
            .over((x) => x - 1),
        {
            x: 1.5,
            y: 3,
        },
    );
});
