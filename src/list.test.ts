import { assertEquals } from "../deps.ts";
import { doT } from "./cat.ts";
import { monad, range, toArray } from "./list.ts";

Deno.test("with CatT", () => {
    // Find patterns where `x + y + z == 5` for all natural number `x`, `y`, and `z`.
    const patterns = doT(monad)
        .addM("x", range(0, 6))
        .addMWith("y", ({ x }) => range(0, 6 - x))
        .addWith("z", ({ x, y }) => 5 - (x + y))
        .finish(({ x, y, z }) => [x, y, z] as const);

    assertEquals(toArray(patterns), [
        [0, 0, 5],
        [0, 1, 4],
        [0, 2, 3],
        [0, 3, 2],
        [0, 4, 1],
        [0, 5, 0],
        [1, 0, 4],
        [1, 1, 3],
        [1, 2, 2],
        [1, 3, 1],
        [1, 4, 0],
        [2, 0, 3],
        [2, 1, 2],
        [2, 2, 1],
        [2, 3, 0],
        [3, 0, 2],
        [3, 1, 1],
        [3, 2, 0],
        [4, 0, 1],
        [4, 1, 0],
        [5, 0, 0],
    ]);
});
