import { assertEquals } from "../deps.ts";
import {
    empty,
    getMin,
    insert,
    isEmpty,
    length,
    popMin,
} from "./binary-heap.ts";
import { doMut } from "./mut.ts";
import { none, some } from "./option.ts";
import { nonNanOrd } from "./type-class/ord.ts";

Deno.test("simple usage", () => {
    doMut((cat) =>
        cat
            .addM(
                "heap",
                empty(nonNanOrd),
            )
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ min }) => {
                assertEquals(min, none());
                return cat.monad.pure([]);
            })
            .runWith(({ heap }) => insert(1)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .addMWith("len", ({ heap }) => length(heap))
            .runWith(({ min, len }) => {
                assertEquals(min, some(1));
                assertEquals(len, 3);
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ popped, min }) => {
                assertEquals(popped, some(1));
                assertEquals(min, some(2));
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ popped, min }) => {
                assertEquals(popped, some(2));
                assertEquals(min, some(5));
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .addMWith("wasEmpty", ({ heap }) => isEmpty(heap))
            .runWith(({ popped, min, wasEmpty }) => {
                assertEquals(popped, some(5));
                assertEquals(min, none());
                assertEquals(wasEmpty, true);
                return cat.monad.pure([]);
            }).finish(() => {})
    );
});
