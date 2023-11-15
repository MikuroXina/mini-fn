import { assertEquals } from "../../deps.ts";
import { functor } from "../array.ts";
import { opticCat } from "../optical.ts";
import { key } from "./lens.ts";
import { setF } from "./setter.ts";

Deno.test("double both elements of coord", () => {
    const coord = { hoge: 2, foo: [3, 1, 4, 1, 5, 9, 2] as readonly number[] };
    assertEquals(
        opticCat(coord)
            .feed(key("foo"))
            .setWith(setF(functor)((x) => x * 2)),
        { hoge: 2, foo: [6, 2, 8, 2, 10, 18, 4] },
    );
});
