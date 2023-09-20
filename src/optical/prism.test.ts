import { expect, test } from "vitest";

import { opticCat } from "../optical.js";
import { ifSome, none, type Option, some } from "../option.js";
import { key } from "./lens.js";
import { only } from "./prism.js";

test("optional", () => {
    const obj = {
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(12),
        }) as Option<{ bar: number; fuga: Option<number> }>,
    };
    expect(
        opticCat(obj).feed(key("hoge")).feed(ifSome()).feed(key("fuga")).feed(ifSome()).set(42),
    ).toStrictEqual({
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(42),
        }),
    });
});

test("only", () => {
    expect(opticCat(4).feed(only(4)).get()).toStrictEqual(some(4));
    expect(opticCat(4).feed(only(5)).get()).toStrictEqual(none());
});
