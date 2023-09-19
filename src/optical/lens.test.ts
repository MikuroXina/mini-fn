import { expect, test } from "vitest";

import { newOptical } from "../optical.js";
import { key, keys, nth } from "./lens.js";

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
            .focus(keys(["x", "y"]))
            .modify((entries) => {
                entries[0][1] *= 2;
                entries[1][1] *= 2;
                return entries;
            }),
    ).toStrictEqual({ x: 2, y: 4 });
});
