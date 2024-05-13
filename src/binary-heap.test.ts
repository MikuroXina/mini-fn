import { assertEquals } from "../deps.ts";
import { intoItems } from "./binary-heap.ts";
import { popMinAndInsert } from "./binary-heap.ts";
import {
    empty,
    getMin,
    insert,
    isEmpty,
    length,
    maxHeap,
    minHeap,
    popMin,
    sortItems,
} from "./binary-heap.ts";
import { doMut, readMutRef } from "./mut.ts";
import { none, some } from "./option.ts";
import { nonNanOrd } from "./type-class/ord.ts";

Deno.test("max heap", () => {
    doMut((cat) =>
        cat.addM("heap", maxHeap(nonNanOrd)([1, 4, 2, 3, 5, 2, 3]))
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(5));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(4));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(1));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .finishM(({ max }) => {
                assertEquals(max, none());
                return cat.monad.pure([]);
            })
    );
});

Deno.test("min heap", () => {
    doMut((cat) =>
        cat.addM("heap", minHeap(nonNanOrd)([1, 4, 2, 3, 5, 2, 3]))
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(1));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(4));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                assertEquals(max, some(5));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .finishM(({ max }) => {
                assertEquals(max, none());
                return cat.monad.pure([]);
            })
    );
});

Deno.test("intoItems", () => {
    const items = doMut((cat) =>
        cat.addM("heap", empty(nonNanOrd))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(4)(heap))
            .runWith(({ heap }) => insert(1)(heap))
            .addMWith("inner", ({ heap }) => readMutRef(heap))
            .finish(({ inner }) => intoItems(inner))
    );
    assertEquals(items, [1, 2, 2, 3, 3, 5, 4]);
});

Deno.test("sortItems", () => {
    const items = doMut((cat) =>
        cat.addM("heap", empty(nonNanOrd))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(4)(heap))
            .runWith(({ heap }) => insert(1)(heap))
            .finishM(({ heap }) => sortItems(heap))
    );
    assertEquals(items, [1, 2, 2, 3, 3, 4, 5]);
});

Deno.test("popMin", () => {
    doMut((cat) =>
        cat.addM("heap", empty(nonNanOrd))
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                assertEquals(min, none());
                return cat.monad.pure([]);
            })
    );
    doMut((cat) =>
        cat.addM("heap", minHeap(nonNanOrd)([]))
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                assertEquals(min, none());
                return cat.monad.pure([]);
            })
    );
});

Deno.test("popMinAndInsert", () => {
    doMut((cat) =>
        cat.addM("heap", empty(nonNanOrd))
            .addMWith("min", ({ heap }) => popMinAndInsert(4)(heap))
            .runWith(({ min }) => {
                assertEquals(min, none());
                return cat.monad.pure([]);
            })
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                assertEquals(min, some(4));
                return cat.monad.pure([]);
            })
    );
    doMut((cat) =>
        cat.addM("heap", minHeap(nonNanOrd)([]))
            .addMWith("min", ({ heap }) => popMinAndInsert(4)(heap))
            .runWith(({ min }) => {
                assertEquals(min, none());
                return cat.monad.pure([]);
            }).addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                assertEquals(min, some(4));
                return cat.monad.pure([]);
            })
    );
});

Deno.test("simple usage", () => {
    doMut((cat) =>
        cat.addM("heap", empty(nonNanOrd))
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
