import { expect, test } from "vitest";

import { overCat } from "../optical.js";
import { bitraversable, type Tuple } from "../tuple.js";
import { both } from "./traversal.js";

test("get length of string for each element of tuple", () => {
    const tuple: Tuple<string, string> = ["hello", "world"];
    expect(
        overCat((s: string) => s.length)
            .on(both(bitraversable))
            .from(tuple),
    ).toStrictEqual([5, 5]);
});
