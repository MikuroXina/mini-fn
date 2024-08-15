import { overCat } from "../optical.ts";
import { bitraversable, type Tuple } from "../tuple.ts";
import { both, traversed } from "./traversal.ts";
import { assertEquals } from "../../deps.ts";
import { Array } from "../../mod.ts";

Deno.test("get length of string for each element of tuple", () => {
    const tuple: Tuple<string, string> = ["hello", "world"];
    assertEquals(
        overCat((s: string) => s.length)
            .on(both(bitraversable))
            .from(tuple),
        [5, 5],
    );
});

Deno.test("traversed", () => {
    const values = ["hey", "what", "are", "you", "doing"];
    assertEquals(
        overCat((s: string) => s.length)
            .on(traversed(Array.traversable))
            .from(values),
        [3, 4, 3, 3, 5],
    );
});
