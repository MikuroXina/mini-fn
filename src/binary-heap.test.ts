import { expect, test } from "vitest";
import {
    empty,
    getMin,
    insert,
    intoItems,
    isEmpty,
    length,
    maxHeap,
    minHeap,
    popMin,
    popMinAndInsert,
    sortItems,
} from "./binary-heap.js";
import { doMut, readMutRef } from "./mut.js";
import { none, some } from "./option.js";
import { nonNanOrd } from "./type-class/ord.js";

test("max heap", () => {
    doMut((cat) =>
        cat
            .addM("heap", maxHeap(nonNanOrd)([1, 4, 2, 3, 5, 2, 3]))
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(5));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(4));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(1));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .finishM(({ max }) => {
                expect(max).toStrictEqual(none());
                return cat.monad.pure([]);
            }),
    );
});

test("min heap", () => {
    doMut((cat) =>
        cat
            .addM("heap", minHeap(nonNanOrd)([1, 4, 2, 3, 5, 2, 3]))
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(1));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(3));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(4));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .runWith(({ max }) => {
                expect(max).toStrictEqual(some(5));
                return cat.monad.pure([]);
            })
            .addMWith("max", ({ heap }) => popMin(heap))
            .finishM(({ max }) => {
                expect(max).toStrictEqual(none());
                return cat.monad.pure([]);
            }),
    );
});

test("intoItems", () => {
    const items = doMut((cat) =>
        cat
            .addM("heap", empty(nonNanOrd))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(4)(heap))
            .runWith(({ heap }) => insert(1)(heap))
            .addMWith("inner", ({ heap }) => readMutRef(heap))
            .finish(({ inner }) => intoItems(inner)),
    );
    expect(items).toStrictEqual([1, 2, 2, 3, 3, 5, 4]);
});

test("sortItems", () => {
    const items = doMut((cat) =>
        cat
            .addM("heap", empty(nonNanOrd))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(3)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .runWith(({ heap }) => insert(4)(heap))
            .runWith(({ heap }) => insert(1)(heap))
            .finishM(({ heap }) => sortItems(heap)),
    );
    expect(items).toStrictEqual([1, 2, 2, 3, 3, 4, 5]);
});

test("popMin", () => {
    doMut((cat) =>
        cat
            .addM("heap", empty(nonNanOrd))
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                expect(min).toStrictEqual(none());
                return cat.monad.pure([]);
            }),
    );
    doMut((cat) =>
        cat
            .addM("heap", minHeap(nonNanOrd)([]))
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                expect(min).toStrictEqual(none());
                return cat.monad.pure([]);
            }),
    );
});

test("popMinAndInsert", () => {
    doMut((cat) =>
        cat
            .addM("heap", empty(nonNanOrd))
            .addMWith("min", ({ heap }) => popMinAndInsert(4)(heap))
            .runWith(({ min }) => {
                expect(min).toStrictEqual(none());
                return cat.monad.pure([]);
            })
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                expect(min).toStrictEqual(some(4));
                return cat.monad.pure([]);
            }),
    );
    doMut((cat) =>
        cat
            .addM("heap", minHeap(nonNanOrd)([]))
            .addMWith("min", ({ heap }) => popMinAndInsert(4)(heap))
            .runWith(({ min }) => {
                expect(min).toStrictEqual(none());
                return cat.monad.pure([]);
            })
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                expect(min).toStrictEqual(some(4));
                return cat.monad.pure([]);
            }),
    );
    doMut((cat) =>
        cat
            .addM("heap", minHeap(nonNanOrd)([1, 4]))
            .addMWith("min", ({ heap }) => popMinAndInsert(2)(heap))
            .runWith(({ min }) => {
                expect(min).toStrictEqual(some(1));
                return cat.monad.pure([]);
            })
            .addMWith("min", ({ heap }) => popMin(heap))
            .runWith(({ min }) => {
                expect(min).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("min", ({ heap }) => popMin(heap))
            .finishM(({ min }) => {
                expect(min).toStrictEqual(some(4));
                return cat.monad.pure([]);
            }),
    );
});

test("simple usage", () => {
    doMut((cat) =>
        cat
            .addM("heap", empty(nonNanOrd))
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ min }) => {
                expect(min).toStrictEqual(none());
                return cat.monad.pure([]);
            })
            .runWith(({ heap }) => insert(1)(heap))
            .runWith(({ heap }) => insert(5)(heap))
            .runWith(({ heap }) => insert(2)(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .addMWith("len", ({ heap }) => length(heap))
            .runWith(({ min, len }) => {
                expect(min).toStrictEqual(some(1));
                expect(len).toStrictEqual(3);
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ popped, min }) => {
                expect(popped).toStrictEqual(some(1));
                expect(min).toStrictEqual(some(2));
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .runWith(({ popped, min }) => {
                expect(popped).toStrictEqual(some(2));
                expect(min).toStrictEqual(some(5));
                return cat.monad.pure([]);
            })
            .addMWith("popped", ({ heap }) => popMin(heap))
            .addMWith("min", ({ heap }) => getMin(heap))
            .addMWith("wasEmpty", ({ heap }) => isEmpty(heap))
            .runWith(({ popped, min, wasEmpty }) => {
                expect(popped).toStrictEqual(some(5));
                expect(min).toStrictEqual(none());
                expect(wasEmpty).toStrictEqual(true);
                return cat.monad.pure([]);
            })
            .finish(() => {}),
    );
});
