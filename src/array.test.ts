import { assertEquals } from "../deps.ts";
import { foldR, fromReduce, reduceL, reduceR, traverse } from "./array.ts";
import { range, reduce } from "./list.ts";
import { monad, type PromiseHkt } from "./promise.ts";

const sub = (next: number) => (acc: number) => next - acc;

Deno.test("foldR", () => {
    assertEquals(
        foldR(sub)(0)([]),
        0,
    );

    const actual = foldR(sub)(0)([
        1,
        4,
        2,
        3,
        5,
        2,
        3,
    ]);
    assertEquals(actual, 2);
});

Deno.test("traverse", async () => {
    const actual = await traverse<PromiseHkt>(monad)((item: string) =>
        Promise.resolve(item.length)
    )(["foo", "hoge"]);
    assertEquals(actual, [3, 4]);
});

Deno.test("fromReduce", () => {
    const actual = fromReduce(reduce)(range(0, 4));
    assertEquals(actual, [0, 1, 2, 3]);
});

Deno.test("reduceR", () => {
    assertEquals(reduceR(sub)([])(0), 0);

    const actual = reduceR(sub)([1, 4, 2, 3, 5, 2, 3])(0);
    assertEquals(actual, 2);
});

Deno.test("reduceL", () => {
    assertEquals(reduceL(sub)(0)([]), 0);

    const actual = reduceL(sub)(0)([1, 4, 2, 3, 5, 2, 3]);
    assertEquals(actual, -20);
});
