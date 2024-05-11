import { assertEquals } from "../deps.ts";
import { doMut, readMutRef } from "./mut.ts";
import {
    clear,
    get,
    insert,
    intoItems,
    intoMut,
    query,
    withItems,
} from "./seg-tree.ts";
import { addMonoid } from "./type-class/monoid.ts";

Deno.test("query", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    for (let from = -1; from <= 7; ++from) {
        for (let to = 0; to <= 8; ++to) {
            let expected = 0;
            for (let i = from; i < to; ++i) {
                expected += i in src ? src[i] : 0;
            }
            assertEquals(query(from)(to)(seq), expected);
        }
    }
});

Deno.test("get", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    for (let i = 0; i < src.length; ++i) {
        assertEquals(get(i)(seq), src[i]);
    }
});

Deno.test("intoItems", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    const actual = intoItems(seq);
    assertEquals(actual.length, src.length);
    for (let i = 0; i < src.length; ++i) {
        assertEquals(actual[i], src[i]);
    }
});

Deno.test("clear", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    const cleared = doMut((cat) =>
        cat.addM("ref", intoMut(seq))
            .runWith(({ ref }) => clear(ref))
            .finishM(({ ref }) => readMutRef(ref))
    );
    const actual = intoItems(cleared);
    assertEquals(actual.length, src.length);
    for (let i = 0; i < src.length; ++i) {
        assertEquals(actual[i], 0);
    }
});

Deno.test("insert", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    assertEquals(query(1)(3)(seq), 6);
    const inserted = doMut((cat) =>
        cat.addM("ref", intoMut(seq))
            .runWith(({ ref }) => insert(ref)(1)(7))
            .finishM(({ ref }) => readMutRef(ref))
    );
    assertEquals(query(1)(3)(inserted), 9);
});
