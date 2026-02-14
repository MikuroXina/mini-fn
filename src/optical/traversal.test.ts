import { expect, test } from "vitest";
import * as Array from "../array.js";
import { overCat } from "../optical.js";
import { bitraversable, type Tuple } from "../tuple.js";
import { both, traversed } from "./traversal.js";

test("get length of string for each element of tuple", () => {
    const tuple: Tuple<string, string> = ["hello", "world"];
    expect(
        overCat((s: string) => s.length)
            .on(both(bitraversable))
            .from(tuple),
    ).toStrictEqual([5, 5]);
});

test("traversed", () => {
    const values = ["hey", "what", "are", "you", "doing"];
    expect(
        overCat((s: string) => s.length)
            .on(traversed(Array.traversable))
            .from(values),
    ).toStrictEqual([3, 4, 3, 3, 5]);
});
