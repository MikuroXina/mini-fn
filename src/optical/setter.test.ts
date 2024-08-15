import { assertEquals } from "../../deps.ts";
import { functor, monad } from "../array.ts";
import { opticCat } from "../optical.ts";
import { key } from "./lens.ts";
import { set, setF, setM } from "./setter.ts";

Deno.test("double both elements of coord", () => {
    const coord = { hoge: 2, foo: [3, 1, 4, 1, 5, 9, 2] as readonly number[] };
    assertEquals(
        opticCat(coord)
            .feed(key("foo"))
            .setWith(setF(functor)((x) => x * 2)),
        { hoge: 2, foo: [6, 2, 8, 2, 10, 18, 4] },
    );
});

Deno.test("set", () => {
    assertEquals(
        opticCat({ foo: 60n, bar: false })
            .feed(key("bar"))
            .setWith(set((x) => !x)),
        { foo: 60n, bar: true },
    );
});

Deno.test("setM", () => {
    const coord = { hoge: 2, foo: [3, 1, 4, 1, 5, 9, 2] as readonly number[] };
    assertEquals(
        opticCat(coord)
            .feed(key("foo"))
            .setWith(setM(monad)((x) => x * 2)),
        { hoge: 2, foo: [6, 2, 8, 2, 10, 18, 4] },
    );
});
