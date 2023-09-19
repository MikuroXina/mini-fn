import { expect, test } from "vitest";

import { key, keys, newOptical, nth } from "./optical.js";

test("deep structure", () => {
    const hoge = {
        a: 0,
        fuga: {
            b: "hoge",
            piyo: [42],
        },
    };
    expect(newOptical(hoge).focus(key("fuga")).focus(key("piyo")).focus(nth(0)).get()).toEqual(42);
    expect(
        newOptical(hoge).focus(key("fuga")).focus(key("piyo")).focus(nth(0)).set(31),
    ).toStrictEqual({
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
        newOptical(coord)
            .focus(key("x"))
            .modify((x) => x - 1),
    ).toStrictEqual({
        x: 1.5,
        y: 3,
    });
});

test("double both elements of coord", () => {
    const coord = { x: 1, y: 2 };
    expect(
        newOptical(coord)
            .focus<number>(keys("x", "y"))
            .modify((n) => 2 * n),
    ).toStrictEqual({ x: 2, y: 4 });
});
