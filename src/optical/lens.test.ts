import { assertEquals } from "../../deps.ts";
import { opticCat } from "../optical.ts";
import { key, keys, nth } from "./lens.ts";

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

Deno.test("keys", () => {
    const record = {
        foo: 4,
        bar: "xyz",
        baz: 7,
    };
    const updated = opticCat(record)
        .feed(keys(["foo", "bar"]))
        .over((entries): [["foo", number], ["bar", string]] =>
            entries.map((
                entry: ["foo", number] | ["bar", string],
            ): ["foo", number] | ["bar", string] =>
                entry[0] === "foo"
                    ? [
                        entry[0],
                        entry[1] + 1,
                    ]
                    : [
                        entry[0],
                        "vw " + entry[1],
                    ]
            ) as [["foo", number], ["bar", string]]
        );
    assertEquals(updated, {
        foo: 5,
        bar: "vw xyz",
        baz: 7,
    });
});
