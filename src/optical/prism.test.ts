import { expect, test } from "vitest";

import { opticCat } from "../optical.js";
import { ifSome, type Option, some } from "../option.js";
import { key } from "./lens.js";

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
