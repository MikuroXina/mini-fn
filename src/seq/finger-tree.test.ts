import { assertEquals } from "../../deps.ts";
import { Array } from "../../mod.ts";
import { cat } from "../cat.ts";
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
} from "./finger-tree.ts";

const toArray = Array.fromReduce(reduceTree);

Deno.test("type check", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    assertEquals(isEmpty(emptiness), true);
    assertEquals(isEmpty(single), false);
    assertEquals(isEmpty(many), false);

    assertEquals(isSingle(emptiness), false);
    assertEquals(isSingle(single), true);
    assertEquals(isSingle(many), false);

    assertEquals(isDeep(emptiness), false);
    assertEquals(isDeep(single), false);
    assertEquals(isDeep(many), true);
});

Deno.test("reduceNode", () => {
    const small: Node<string> = ["a", "b"];
    const big: Node<string> = ["x", "y", "z"];

    const concatStr = (x: string) => (y: string) => x + y;
    assertEquals(reduceNode.reduceR(concatStr)(small)("!"), "ab!");
    assertEquals(reduceNode.reduceR(concatStr)(big)("!"), "xyz!");
});

Deno.test("size", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 1, 8]);

    assertEquals(size(emptiness), 0);
    assertEquals(size(single), 1);
    assertEquals(size(many), 5);
});

Deno.test("appendToHead", () => {
    const actual = cat(empty)
        .feed(appendToHead("?"))
        .feed(appendToHead("i"))
        .feed(appendToHead("h"))
        .value;

    assertEquals(toArray(actual), ["h", "i", "?"]);
});

Deno.test("appendManyToHead", () => {
    const actual = appendManyToHead(Array.reduce)("Vinegar".split(""))(empty);

    assertEquals(toArray(actual), ["V", "i", "n", "e", "g", "a", "r"]);
});

Deno.test("appendBetween", () => {
    assertEquals(
        toArray(appendBetween<string>(empty)(["d", "o", "t"])(empty)),
        ["d", "o", "t"],
    );
    assertEquals(
        toArray(
            appendBetween<string>(fromArray(["g", "o"]))(["d", "o", "t"])(
                empty,
            ),
        ),
        ["g", "o", "d", "o", "t"],
    );
    assertEquals(
        toArray(
            appendBetween<string>(empty)(["d", "o", "t"])(
                fromArray(["t", "e", "r"]),
            ),
        ),
        ["d", "o", "t", "t", "e", "r"],
    );
    assertEquals(
        toArray(
            appendBetween<string>(fromArray(["g", "o"]))(["d", "o", "t"])(
                fromArray(["t", "e", "r"]),
            ),
        ),
        ["g", "o", "d", "o", "t", "t", "e", "r"],
    );
});

Deno.test("concat", () => {
    const emptiness = empty;
    const single = fromArray([3]);
    const many = fromArray([2, 1, 8, 2, 8]);

    assertEquals(toArray(concat(emptiness)(emptiness)), []);
    assertEquals(toArray(concat(emptiness)(single)), [3]);
    assertEquals(toArray(concat(single)(emptiness)), [3]);
    assertEquals(toArray(concat(single)(single)), [3, 3]);
    assertEquals(toArray(concat(emptiness)(many)), [2, 1, 8, 2, 8]);
    assertEquals(toArray(concat(many)(emptiness)), [2, 1, 8, 2, 8]);
    assertEquals(toArray(concat(single)(many)), [3, 2, 1, 8, 2, 8]);
    assertEquals(toArray(concat(many)(single)), [2, 1, 8, 2, 8, 3]);
    assertEquals(toArray(concat(many)(many)), [
        2,
        1,
        8,
        2,
        8,
        2,
        1,
        8,
        2,
        8,
    ]);
});
