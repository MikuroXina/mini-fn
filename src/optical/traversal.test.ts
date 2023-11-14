import { overCat } from "../optical.ts";
import { bitraversable, type Tuple } from "../tuple.ts";
import { both } from "./traversal.ts";
import { assertEquals } from "std/assert/mod.ts";

Deno.test("get length of string for each element of tuple", () => {
    const tuple: Tuple<string, string> = ["hello", "world"];
    assertEquals(
        overCat((s: string) => s.length)
            .on(both(bitraversable))
            .from(tuple),
        [5, 5],
    );
});
