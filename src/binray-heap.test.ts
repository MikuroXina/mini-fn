import { assertEquals } from "../deps.ts";
import {
    empty,
    getMin,
    insert,
    isEmpty,
    length,
    popMin,
} from "./binary-heap.ts";
import { cat } from "./cat.ts";
import { none, some } from "./option.ts";
import type { Ordering } from "./ordering.ts";
import { fromCmp } from "./type-class/ord.ts";

Deno.test("simple usage", () => {
    const heap = empty(
        fromCmp(() => (l: number, r: number) => Math.sign(l - r) as Ordering)(),
    );
    assertEquals(getMin(heap), none());

    let inserted = cat(heap)
        .feed(insert(1))
        .feed(insert(5))
        .feed(insert(2))
        .value;
    assertEquals(getMin(inserted), some(1));
    assertEquals(length(inserted), 3);

    inserted = popMin(inserted);
    assertEquals(getMin(inserted), some(2));
    inserted = popMin(inserted);
    assertEquals(getMin(inserted), some(5));
    inserted = popMin(inserted);
    assertEquals(getMin(heap), none());
    assertEquals(isEmpty(inserted), true);
});
