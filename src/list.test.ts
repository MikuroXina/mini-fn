import { expect, test } from "vitest";

import {
    appendToHead,
    appendToTail,
    atMay,
    choices,
    concat,
    digits,
    drop,
    dropWhile,
    dropWhileEnd,
    empty,
    findIndex,
    findIndices,
    foldL,
    foldR,
    fromArray,
    fromOption,
    fromString,
    group,
    head,
    init,
    intercalate,
    intersperse,
    isNull,
    last,
    length,
    map,
    permutations,
    plus,
    range,
    repeat,
    replicate,
    reverse,
    scanL,
    singleton,
    span,
    spanNot,
    splitAt,
    stripPrefix,
    subsequences,
    successors,
    take,
    takeWhile,
    toArray,
    toIterator,
    toString,
    transpose,
    unCons,
    unfoldR,
    unzip,
    zip,
    zip3,
    zip4,
    zipWith,
} from "./list.js";
import { type Option, none, map as optionMap, some } from "./option.js";
import { strict } from "./type-class/partial-eq.js";

test("isNull", () => {
    expect(isNull(empty())).toEqual(true);
    expect(isNull(repeat(0))).toEqual(false);
});

test("toIterator", () => {
    const iota = successors((x: number) => x + 1)(0);
    const iter = toIterator(iota);
    expect(iter.next()).toEqual({ value: 0, done: false });
    expect(iter.next()).toEqual({ value: 1, done: false });
    expect(iter.next()).toEqual({ value: 2, done: false });
    expect(iter.next()).toEqual({ value: 3, done: false });
});

test("unCons", () => {
    expect(unCons(empty())).toEqual(none());
    expect(unCons(singleton(42))).toEqual(some([42, empty()]));
});

test("map", () => {
    const iota = successors((x: number) => x + 1)(0);
    const mapped = toIterator(map((x: number) => x * 3 + 1)(iota));
    expect(mapped.next()).toEqual({ value: 1, done: false });
    expect(mapped.next()).toEqual({ value: 4, done: false });
    expect(mapped.next()).toEqual({ value: 7, done: false });
    expect(mapped.next()).toEqual({ value: 10, done: false });
});

test("plus", () => {
    const singleZero = singleton(0);
    const emptiness = empty<number>();

    const iter = toIterator(plus(singleZero)(singleZero));
    expect(iter.next()).toEqual({ value: 0, done: false });
    expect(iter.next()).toEqual({ value: 0, done: false });
    expect(iter.next()).toEqual({ done: true });
    expect(unCons(plus(singleZero)(emptiness))).toEqual(some([0, empty()]));
    expect(unCons(plus(emptiness)(singleZero))).toEqual(some([0, empty()]));
    expect(unCons(plus(emptiness)(emptiness))).toEqual(none());
});
test("appendToHead", () => {
    const iter = toIterator(appendToHead(1)(singleton(4)));
    expect(iter.next()).toEqual({ value: 1, done: false });
    expect(iter.next()).toEqual({ value: 4, done: false });
    expect(iter.next()).toEqual({ done: true });
});
test("appendToTail", () => {
    const iter = toIterator(appendToTail(1)(singleton(4)));
    expect(iter.next()).toEqual({ value: 4, done: false });
    expect(iter.next()).toEqual({ value: 1, done: false });
    expect(iter.next()).toEqual({ done: true });
});

test("repeat", () => {
    const iter = toIterator(repeat(13));
    expect(iter.next()).toEqual({ value: 13, done: false });
    expect(iter.next()).toEqual({ value: 13, done: false });
    expect(iter.next()).toEqual({ value: 13, done: false });
    expect(iter.next()).toEqual({ value: 13, done: false });
});

test("successors", () => {
    const iter = toIterator(successors((str: string) => str + "a")(""));
    expect(iter.next()).toEqual({ value: "", done: false });
    expect(iter.next()).toEqual({ value: "a", done: false });
    expect(iter.next()).toEqual({ value: "aa", done: false });
    expect(iter.next()).toEqual({ value: "aaa", done: false });
    expect(iter.next()).toEqual({ value: "aaaa", done: false });
});

test("range", () => {
    expect(toArray(range(0, 5))).toEqual([0, 1, 2, 3, 4]);
    expect(toArray(range(0, 5, 0.5))).toEqual([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]);
    expect(toArray(range(2, 3))).toEqual([2]);
    expect(toArray(range(3, 6))).toEqual([3, 4, 5]);
    expect(toArray(range(3, 3))).toEqual([]);
    expect(toArray(range(5, 0))).toEqual([]);
    expect(toArray(range(3, 2))).toEqual([]);
});

test("digits", () => {
    expect(toArray(digits(51413, 10))).toEqual([3, 1, 4, 1, 5]);
    expect(toArray(digits(0x51413, 16))).toEqual([3, 1, 4, 1, 5]);
    expect(toArray(digits(0o51413, 8))).toEqual([3, 1, 4, 1, 5]);
    expect(toArray(digits(0b1001011001, 2))).toEqual([1, 0, 0, 1, 1, 0, 1, 0, 0, 1]);

    expect(toArray(digits(0, 10))).toEqual([]);
});

test("fromString", () => {
    expect(toArray(fromString("hoge"))).toEqual(["h", "o", "g", "e"]);
    expect(toArray(fromString(""))).toEqual([]);
});
test("fromArray", () => {
    expect(toArray(fromArray([2.81, 3.14, 1.58]))).toEqual([2.81, 3.14, 1.58]);
    expect(toArray(fromArray([]))).toEqual([]);
});
test("fromOption", () => {
    const listOf2 = fromOption(some(2));
    expect(listOf2.current()).toEqual(some(2));
    expect(listOf2.rest()).toEqual(empty());

    const listOfNone = fromOption(none());
    expect(listOfNone.current()).toEqual(none());
    expect(listOfNone.rest()).toEqual(empty());
});

test("foldL", () => {
    expect(foldL((x: string) => (y: string) => y + x)("")(fromString("hoge"))).toEqual("egoh");
    expect(foldL((x: string) => (y: string) => y + x)("")(fromString(""))).toEqual("");
});

test("foldR", () => {
    expect(foldR((x: string) => (y: string) => x + y)("")(fromString("hoge"))).toEqual("hoge");
    expect(foldR((x: string) => (y: string) => y + x)("")(fromString(""))).toEqual("");
});

test("length", () => {
    expect(length(empty())).toEqual(0);
    expect(length(singleton(42))).toEqual(1);
    expect(length(fromString("foo"))).toEqual(3);
});

test("concat", () => {
    const aList = singleton(42);
    const bList = empty<number>();
    const cList = fromArray([5, 4, 1, 2]);
    const listList = fromArray([aList, bList, cList]);
    expect(toArray(concat(listList))).toEqual([42, 5, 4, 1, 2]);
});

test("scanL", () => {
    const aList = fromArray([1, 2, 2, 4, 4, 3]);
    const partialSum = scanL((a: number) => (b: number) => a + b)(0)(aList);
    expect(toArray(partialSum)).toEqual([0, 1, 3, 5, 9, 13, 16]);
});

test("head", () => {
    expect(head(empty())).toEqual(none());
    expect(head(fromString("hoge"))).toEqual(some("h"));

    const list = singleton(42);
    expect(head(list)).toEqual(some(42));
    expect(head(list.rest())).toEqual(none());
});
test("last", () => {
    expect(last(empty())).toEqual(none());
    expect(last(fromString("hoge"))).toEqual(some("e"));

    const list = singleton(42);
    expect(last(list)).toEqual(some(42));
    expect(last(list.rest())).toEqual(none());
});

test("reverse", () => {
    expect(reverse(empty())).toEqual(empty());
    expect(toArray(reverse(fromArray([1, 4, 2, 3])))).toEqual([3, 2, 4, 1]);
    expect(toArray(reverse(fromString("hoge")))).toEqual(["e", "g", "o", "h"]);
});

test("init", () => {
    expect(init(empty())).toEqual(empty());

    expect(toArray(init(fromArray([5, 2, 1, 3])))).toEqual([5, 2, 1]);
});

test("zip", () => {
    const aList = fromArray([1, 4, 2]);
    const bList = fromArray([3, 5, 2]);
    const cList = fromArray([3, 8, 4, 7, 6]);
    const dList = fromArray([6, 2, 9, 8]);

    expect(toArray(zip(aList)(bList))).toEqual([
        [1, 3],
        [4, 5],
        [2, 2],
    ]);

    expect(toArray(zip3(aList)(bList)(cList))).toEqual([
        [1, 3, 3],
        [4, 5, 8],
        [2, 2, 4],
    ]);

    expect(toArray(zip4(aList)(bList)(cList)(dList))).toEqual([
        [1, 3, 3, 6],
        [4, 5, 8, 2],
        [2, 2, 4, 9],
    ]);
});

test("zipWith", () => {
    const aList = fromArray([1, 4, 2]);
    const bList = fromArray([3, 5, 2]);

    const zipped = zipWith((a: number) => (b: number) => a * b)(aList)(bList);
    expect(toArray(zipped)).toEqual([3, 20, 4]);
});

test("unzip", () => {
    const [aList, bList] = unzip(
        fromArray([
            [2, 3],
            [5, 4],
            [11, 3],
        ]),
    );
    expect(toArray(aList)).toEqual([2, 5, 11]);
    expect(toArray(bList)).toEqual([3, 4, 3]);
});

test("intersperse", () => {
    expect(intersperse(0)(empty())).toEqual(empty());

    expect(toString(intersperse(" ")(fromString("hoge")))).toEqual("h o g e");
});
test("intercalate", () => {
    expect(intercalate(singleton(0))(empty())).toEqual(empty());

    const joined = intercalate(fromString(", "))(
        fromArray([fromString("foo"), fromString("bar"), fromString("bee")]),
    );
    expect(toString(joined)).toEqual("foo, bar, bee");
});

test("transpose", () => {
    const matrix = fromArray([fromArray([1, 2, 3]), fromArray([4, 5, 6])]);
    const transposed = transpose(matrix);
    const actual = toArray(transposed).map((col) => toArray(col));
    expect(actual).toEqual([
        [1, 4],
        [2, 5],
        [3, 6],
    ]);
});

test("subsequences", () => {
    expect(subsequences(empty())).toEqual(empty());

    const subSeq = subsequences(fromArray([1, 2, 3, 4]));
    const sequences = toArray(subSeq).map((seq) => toArray(seq));
    expect(sequences).toEqual([
        [1],
        [2],
        [1, 2],
        [3],
        [1, 3],
        [2, 3],
        [1, 2, 3],
        [4],
        [1, 4],
        [2, 4],
        [1, 2, 4],
        [3, 4],
        [1, 3, 4],
        [2, 3, 4],
        [1, 2, 3, 4],
    ]);
});

test("permutations", () => {
    expect(permutations(empty())).toEqual(empty());

    const subSeq = permutations(range(1, 5));
    const sequences = toArray(subSeq).map((seq) => toArray(seq));
    expect(sequences).toEqual([
        [1, 2, 3, 4],
        [2, 1, 3, 4],
        [3, 2, 1, 4],
        [2, 3, 1, 4],
        [3, 1, 2, 4],
        [1, 3, 2, 4],
        [4, 3, 2, 1],
        [3, 4, 2, 1],
        [3, 2, 4, 1],
        [4, 2, 3, 1],
        [2, 4, 3, 1],
        [2, 3, 4, 1],
        [4, 1, 2, 3],
        [1, 4, 2, 3],
        [1, 2, 4, 3],
        [4, 2, 1, 3],
        [2, 4, 1, 3],
        [2, 1, 4, 3],
        [4, 1, 3, 2],
        [1, 4, 3, 2],
        [1, 3, 4, 2],
        [4, 3, 1, 2],
        [3, 4, 1, 2],
        [3, 1, 4, 2],
    ]);
});

test("unfoldR", () => {
    const decrement = (n: number): Option<[number, number]> => {
        if (n == 0) {
            return none();
        }
        return some([n, n - 1]);
    };

    expect(toArray(unfoldR(decrement)(10))).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
});

test("take", () => {
    const taken = take(2)(range(1, 6));
    const iter = toIterator(taken);
    expect(iter.next()).toEqual({ value: 1, done: false });
    expect(iter.next()).toEqual({ value: 2, done: false });
    expect(iter.next()).toEqual({ done: true });
});
test("drop", () => {
    const dropped = drop(2)(range(1, 6));
    const iter = toIterator(dropped);
    expect(iter.next()).toEqual({ value: 3, done: false });
    expect(iter.next()).toEqual({ value: 4, done: false });
    expect(iter.next()).toEqual({ value: 5, done: false });
    expect(iter.next()).toEqual({ done: true });
});
test("splitAt", () => {
    const [left, right] = splitAt(2)(range(1, 6));
    expect(toArray(left)).toEqual([1, 2]);
    expect(toArray(right)).toEqual([3, 4, 5]);
});

test("replicate", () => {
    const replicated = replicate(4)(42);
    const iter = toIterator(replicated);
    expect(iter.next()).toEqual({ value: 42, done: false });
    expect(iter.next()).toEqual({ value: 42, done: false });
    expect(iter.next()).toEqual({ value: 42, done: false });
    expect(iter.next()).toEqual({ value: 42, done: false });
    expect(iter.next()).toEqual({ done: true });
});

test("atMay", () => {
    const nums = range(1, 6);
    expect(atMay(0)(nums)).toEqual(some(1));
    expect(atMay(4)(nums)).toEqual(some(5));
    expect(atMay(-1)(nums)).toEqual(none());
    expect(atMay(5)(nums)).toEqual(none());
});
test("findIndex/findIndices", () => {
    const list = fromArray([1, 4, 2, 3, 5]);

    expect(findIndex((x: number) => 4 <= x)(list)).toEqual(some(1));
    expect(findIndex((x: number) => 0 <= x)(list)).toEqual(some(0));
    expect(findIndex((x: number) => 8 <= x)(list)).toEqual(none());

    expect(findIndices((x: number) => 4 <= x)(list)).toEqual([1, 4]);
    expect(findIndices((x: number) => 0 <= x)(list)).toEqual([0, 1, 2, 3, 4]);
    expect(findIndices((x: number) => 8 <= x)(list)).toEqual([]);
});

test("takeWhile", () => {
    const nums = range(1, 100);
    const takeWhileSquared = takeWhile((x: number) => x * x <= 20)(nums);
    expect(toArray(takeWhileSquared)).toEqual([1, 2, 3, 4]);
});

test("dropWhile", () => {
    expect([
        ...toIterator(dropWhile((x: number) => x < 3)(fromArray([1, 2, 3, 4, 5, 1, 2, 3]))),
    ]).toEqual([3, 4, 5, 1, 2, 3]);
    expect(toArray(dropWhile((x: number) => x < 9)(fromArray([1, 2, 3])))).toEqual([]);
    expect(toArray(dropWhile((x: number) => x < 0)(fromArray([1, 2, 3])))).toEqual([1, 2, 3]);
});
test("dropWhileEnd", () => {
    expect([
        ...toIterator(dropWhileEnd((x: number) => x < 3)(fromArray([1, 2, 3, 4, 5, 1, 2]))),
    ]).toEqual([1, 2, 3, 4, 5]);
    expect(toArray(dropWhile((x: number) => x < 9)(fromArray([1, 2, 3])))).toEqual([]);
    expect(toArray(dropWhile((x: number) => x < 0)(fromArray([1, 2, 3])))).toEqual([1, 2, 3]);
});

test("span", () => {
    {
        const [left, right] = span((x: number) => x < 3)(fromArray([1, 2, 3, 4, 1, 2, 3, 4]));
        expect(toArray(left)).toEqual([1, 2]);
        expect(toArray(right)).toEqual([3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = span((x: number) => x < 9)(fromArray([1, 2, 3]));
        expect(toArray(left)).toEqual([1, 2, 3]);
        expect(toArray(right)).toEqual([]);
    }
    {
        const [left, right] = span((x: number) => x < 0)(fromArray([1, 2, 3]));
        expect(toArray(left)).toEqual([]);
        expect(toArray(right)).toEqual([1, 2, 3]);
    }
});
test("spanNot", () => {
    {
        const [left, right] = spanNot((x: number) => x > 3)(fromArray([1, 2, 3, 4, 1, 2, 3, 4]));
        expect(toArray(left)).toEqual([1, 2, 3]);
        expect(toArray(right)).toEqual([4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = spanNot((x: number) => x < 9)(fromArray([1, 2, 3]));
        expect(toArray(left)).toEqual([]);
        expect(toArray(right)).toEqual([1, 2, 3]);
    }
    {
        const [left, right] = spanNot((x: number) => x > 9)(fromArray([1, 2, 3]));
        expect(toArray(left)).toEqual([1, 2, 3]);
        expect(toArray(right)).toEqual([]);
    }
});

test("stripPrefix", () => {
    const stripFoo = stripPrefix(strict<string>())(fromString("foo"));

    {
        const optList = stripFoo(fromString("foobar"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toEqual(some("bar"));
    }
    {
        const optList = stripFoo(fromString("foo"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toEqual(some(""));
    }
    {
        const optList = stripFoo(fromString("barfoo"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toEqual(none());
    }
});

test("group", () => {
    const grouped = toArray(group(strict<string>())(fromString("Mississippi"))).map((list) =>
        toString(list),
    );
    expect(grouped).toEqual(["M", "i", "ss", "i", "ss", "i", "pp", "i"]);
});

test("choices", () => {
    const choice = choices(fromArray([range(0, 3), range(3, 6)]));
    const sequences = toArray(choice).map((seq) => toArray(seq));
    expect(sequences).toEqual([
        [0, 3],
        [0, 4],
        [1, 3],
        [0, 5],
        [1, 4],
        [2, 3],
        [1, 5],
        [2, 4],
        [2, 5],
    ]);
});
