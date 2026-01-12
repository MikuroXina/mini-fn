import { expect, test } from "vitest";
import { Array } from "../../mod.js";
import { cat } from "../cat.js";
import {
    appendBetween,
    appendManyToHead,
    appendToHead,
    concat,
    empty,
    fromArray,
    isDeep,
    isEmpty,
    isSingle,
    type Node,
    reduceNode,
    reduceTree,
    size,
} from "./finger-tree.js";

const toArray = Array.fromReduce(reduceTree);

test("type check", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    expect(isEmpty(emptiness)).toStrictEqual(true);
    expect(isEmpty(single)).toStrictEqual(false);
    expect(isEmpty(many)).toStrictEqual(false);

    expect(isSingle(emptiness)).toStrictEqual(false);
    expect(isSingle(single)).toStrictEqual(true);
    expect(isSingle(many)).toStrictEqual(false);

    expect(isDeep(emptiness)).toStrictEqual(false);
    expect(isDeep(single)).toStrictEqual(false);
    expect(isDeep(many)).toStrictEqual(true);
});

test("reduceNode", () => {
    const small: Node<string> = ["a", "b"];
    const big: Node<string> = ["x", "y", "z"];

    const concatStr = (x: string) => (y: string) => x + y;
    expect(reduceNode.reduceR(concatStr)(small)("!")).toStrictEqual("ab!");
    expect(reduceNode.reduceR(concatStr)(big)("!")).toStrictEqual("xyz!");
});

test("size", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    expect(size(emptiness)).toStrictEqual(0);
    expect(size(single)).toStrictEqual(1);
    expect(size(many)).toStrictEqual(5);
});

test("appendToHead", () => {
    const actual = cat(empty)
        .feed(appendToHead("?"))
        .feed(appendToHead("i"))
        .feed(appendToHead("h")).value;

    expect(toArray(actual)).toStrictEqual(["h", "i", "?"]);
});

test("appendManyToHead", () => {
    const actual = appendManyToHead(Array.reduce)("Vinegar".split(""))(empty);

    expect(toArray(actual)).toStrictEqual(["V", "i", "n", "e", "g", "a", "r"]);
});

test("appendBetween", () => {
    expect(
        toArray(appendBetween<string>(empty)(["d", "o", "t"])(empty)),
    ).toStrictEqual(["d", "o", "t"]);
    expect(
        toArray(
            appendBetween<string>(fromArray(["g", "o"]))(["d", "o", "t"])(
                empty,
            ),
        ),
    ).toStrictEqual(["g", "o", "d", "o", "t"]);
    expect(
        toArray(
            appendBetween<string>(empty)(["d", "o", "t"])(
                fromArray(["t", "e", "r"]),
            ),
        ),
    ).toStrictEqual(["d", "o", "t", "t", "e", "r"]);
    expect(
        toArray(
            appendBetween<string>(fromArray(["g", "o"]))(["d", "o", "t"])(
                fromArray(["t", "e", "r"]),
            ),
        ),
    ).toStrictEqual(["g", "o", "d", "o", "t", "t", "e", "r"]);
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
    expect(toArray(concat(many)(many))).toStrictEqual([
        2, 1, 8, 2, 8, 2, 1, 8, 2, 8,
    ]);
});
