import { expect, test } from "vitest";
import { opticCat } from "../optical.js";
import { ifSome, none, type Option, some } from "../option.js";
import { key } from "./lens.js";
import { filter, only, unreachable } from "./prism.js";

test("optional", () => {
    const obj = {
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(12),
        }) as Option<{ bar: number; fuga: Option<number> }>,
    };
    expect(
        opticCat(obj)
            .feed(key("hoge"))
            .feed(ifSome())
            .feed(key("fuga"))
            .feed(ifSome())
            .set(42),
    ).toStrictEqual({
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(42),
        }),
    });
});

test("unreachable", () => {
    expect(opticCat(4).feed(unreachable()).get()).toStrictEqual(none());
});

test("only", () => {
    expect(opticCat(4).feed(only(4)).get()).toStrictEqual(some(4));
    expect(opticCat(4).feed(only(5)).get()).toStrictEqual(none());
    expect(opticCat(4).feed(only(4)).set(6)).toStrictEqual(6);
    expect(opticCat(4).feed(only(5)).set(6)).toStrictEqual(4);
});

test("filter", () => {
    expect(
        opticCat(6)
            .feed(filter((x: number) => x % 2 === 0))
            .get(),
    ).toStrictEqual(some(6));
    expect(
        opticCat(7)
            .feed(filter((x: number) => x % 2 === 0))
            .get(),
    ).toStrictEqual(none());
    expect(
        opticCat(6)
            .feed(filter((x: number) => x % 2 === 0))
            .set(8),
    ).toStrictEqual(8);
    expect(
        opticCat(7)
            .feed(filter((x: number) => x % 2 === 0))
            .set(8),
    ).toStrictEqual(7);
});
