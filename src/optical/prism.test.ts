import { assertEquals } from "../deps.ts";
import { opticCat } from "../optical.ts";
import { ifSome, none, type Option, some } from "../option.ts";
import { key } from "./lens.ts";
import { only } from "./prism.ts";

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

Deno.test("only", () => {
    assertEquals(opticCat(4).feed(only(4)).get(), some(4));
    assertEquals(opticCat(4).feed(only(5)).get(), none());
});
