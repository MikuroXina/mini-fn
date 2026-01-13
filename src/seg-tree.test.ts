import { expect, test } from "vitest";
import { doMut, readMutRef } from "./mut.js";
import {
    clear,
    get,
    insert,
    intoItems,
    intoMut,
    query,
    withItems,
} from "./seg-tree.js";
import { addMonoid } from "./type-class/monoid.js";

test("query", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    for (let from = -1; from <= 7; ++from) {
        for (let to = 0; to <= 8; ++to) {
            let expected = 0;
            for (let i = from; i < to; ++i) {
                expected += src[i] ?? 0;
            }
            expect(query(from)(to)(seq)).toStrictEqual(expected);
        }
    }
});

test("get", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    for (let i = 0; i < src.length; ++i) {
        expect(get(i)(seq)).toStrictEqual(src[i]);
    }
});

test("intoItems", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    const actual = intoItems(seq);
    expect(actual.length).toStrictEqual(src.length);
    for (let i = 0; i < src.length; ++i) {
        expect(actual[i]).toStrictEqual(src[i]);
    }
});

test("clear", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    const cleared = doMut((cat) =>
        cat
            .addM("ref", intoMut(seq))
            .runWith(({ ref }) => clear(ref))
            .finishM(({ ref }) => readMutRef(ref)),
    );
    const actual = intoItems(cleared);
    expect(actual.length).toStrictEqual(src.length);
    for (let i = 0; i < src.length; ++i) {
        expect(actual[i]).toStrictEqual(0);
    }
});

test("insert", () => {
    const src = [1, 4, 2, 3, 5, 2, 3];
    const seq = withItems(addMonoid)(src);
    expect(query(1)(3)(seq)).toStrictEqual(6);
    const inserted = doMut((cat) =>
        cat
            .addM("ref", intoMut(seq))
            .runWith(({ ref }) => insert(ref)(1)(7))
            .finishM(({ ref }) => readMutRef(ref)),
    );
    expect(query(1)(3)(inserted)).toStrictEqual(9);
});
