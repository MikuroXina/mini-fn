import { expect, test } from "vitest";

import { opticCat } from "../optical.js";
import { key, nth } from "./lens.js";

test("deep structure", () => {
    const hoge = {
        a: 0,
        fuga: {
            b: "hoge",
            piyo: [42],
        },
    };

    expect(opticCat(hoge).feed(key("fuga")).feed(key("piyo")).feed(nth(0)).unwrap()).toEqual(42);
    expect(opticCat(hoge).feed(key("fuga")).feed(key("piyo")).feed(nth(0)).set(31)).toStrictEqual({
        a: 0,
        fuga: {
            b: "hoge",
            piyo: [31],
        },
    });
});

test("modify only x", () => {
    const coord = { x: 2.5, y: 3 };
    expect(
        opticCat(coord)
            .feed(key("x"))
            .over((x) => x - 1),
    ).toStrictEqual({
        x: 1.5,
        y: 3,
    });
});
