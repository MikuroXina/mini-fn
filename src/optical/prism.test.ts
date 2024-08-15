import { assertEquals } from "../../deps.ts";
import { opticCat } from "../optical.ts";
import { ifSome, none, type Option, some } from "../option.ts";
import { key } from "./lens.ts";
import { filter } from "./prism.ts";
import { only, unreachable } from "./prism.ts";

Deno.test("optional", () => {
    const obj = {
        foo: "x",
        hoge: some({
            bar: 2,
            fuga: some(12),
        }) as Option<{ bar: number; fuga: Option<number> }>,
    };
    assertEquals(
        opticCat(obj).feed(key("hoge")).feed(ifSome()).feed(key("fuga")).feed(
            ifSome(),
        ).set(42),
        {
            foo: "x",
            hoge: some({
                bar: 2,
                fuga: some(42),
            }),
        },
    );
});

Deno.test("unreachable", () => {
    assertEquals(opticCat(4).feed(unreachable()).get(), none());
});

Deno.test("only", () => {
    assertEquals(opticCat(4).feed(only(4)).get(), some(4));
    assertEquals(opticCat(4).feed(only(5)).get(), none());
    assertEquals(opticCat(4).feed(only(4)).set(6), 6);
    assertEquals(opticCat(4).feed(only(5)).set(6), 4);
});

Deno.test("filter", () => {
    assertEquals(
        opticCat(6).feed(filter((x: number) => x % 2 === 0)).get(),
        some(6),
    );
    assertEquals(
        opticCat(7).feed(filter((x: number) => x % 2 === 0)).get(),
        none(),
    );
});
