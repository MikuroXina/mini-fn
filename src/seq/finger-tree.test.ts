import {
    appendToHead,
    appendToTail,
    concat,
    empty,
    fromArray,
    isDeep,
    isEmpty,
    isSingle,
    reduceTree,
    size,
} from "./finger-tree.js";
import { expect, test } from "vitest";

import { fromReduce } from "../array.js";

test("type check", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    expect(isEmpty(emptiness)).toBeTruthy();
    expect(isEmpty(single)).toBeFalsy();
    expect(isEmpty(many)).toBeFalsy();

    expect(isSingle(emptiness)).toBeFalsy();
    expect(isSingle(single)).toBeTruthy();
    expect(isSingle(many)).toBeFalsy();

    expect(isDeep(emptiness)).toBeFalsy();
    expect(isDeep(single)).toBeFalsy();
    expect(isDeep(many)).toBeTruthy();
});

test("size", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    expect(size(emptiness)).toEqual(0);
    expect(size(single)).toEqual(1);
    expect(size(many)).toEqual(5);
});

const toArray = fromReduce(reduceTree);

test("append", () => {
    const pi = fromArray([1]);
    const piNext = appendToTail(4)(pi);

    expect(toArray(piNext)).toStrictEqual([1, 4]);

    const piPrev = appendToHead(3)(piNext);

    expect(toArray(piPrev)).toStrictEqual([3, 1, 4]);
});

test("concat", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 2, 8]);

    expect(toArray(concat(emptiness)(emptiness))).toStrictEqual([]);

    expect(toArray(concat(emptiness)(single))).toStrictEqual([3]);
    expect(toArray(concat(single)(emptiness))).toStrictEqual([3]);

    expect(toArray(concat(single)(single))).toStrictEqual([3, 3]);

    expect(toArray(concat(emptiness)(many))).toStrictEqual([2, 1, 8, 2, 8]);
    expect(toArray(concat(many)(emptiness))).toStrictEqual([2, 1, 8, 2, 8]);

    expect(toArray(concat(single)(many))).toStrictEqual([3, 2, 1, 8, 2, 8]);
    expect(toArray(concat(many)(single))).toStrictEqual([2, 1, 8, 2, 8, 3]);

    expect(toArray(concat(many)(many))).toStrictEqual([2, 1, 8, 2, 8, 2, 1, 8, 2, 8]);
});
