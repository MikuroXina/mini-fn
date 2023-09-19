import { newOptical } from "src/optical.js";
import { expect, test } from "vitest";

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
        newOptical(obj)
            .focus(key("hoge"))
            .split(ifSome())
            .focus(key("fuga"))
            .split(ifSome())
            .set(42),
    ).toStrictEqual({
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(42),
        }),
    });
});
