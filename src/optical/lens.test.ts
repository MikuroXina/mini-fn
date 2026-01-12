import { expect, test } from "vitest";
import { opticCat } from "../optical.js";
import { key, keys, nth } from "./lens.js";

test("deep structure", () => {
    const hoge = {
        a: 0,
        fuga: {
            b: "hoge",
            piyo: [42],
        },
    };

    expect(
        opticCat(hoge)
            .feed(key("fuga"))
            .feed(key("piyo"))
            .feed(nth(0))
            .unwrap(),
    ).toStrictEqual(42);
    expect(
        opticCat(hoge).feed(key("fuga")).feed(key("piyo")).feed(nth(0)).set(31),
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
        opticCat(coord)
            .feed(key("x"))
            .over((x) => x - 1),
    ).toStrictEqual({
        x: 1.5,
        y: 3,
    });
});

test("keys", () => {
    const record = {
        foo: 4,
        bar: "xyz",
        baz: 7,
    };
    const updated = opticCat(record)
        .feed(keys(["foo", "bar"]))
        .over(
            (entries): [["foo", number], ["bar", string]] =>
                entries.map(
                    (
                        entry: ["foo", number] | ["bar", string],
                    ): ["foo", number] | ["bar", string] =>
                        entry[0] === "foo"
                            ? [entry[0], entry[1] + 1]
                            : [entry[0], "vw " + entry[1]],
                ) as [["foo", number], ["bar", string]],
        );
    expect(updated).toStrictEqual({
        foo: 5,
        bar: "vw xyz",
        baz: 7,
    });
});
