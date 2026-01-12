import { expect, test } from "vitest";
import { Compose, Seq } from "../mod.js";
import { applicative as arrayApp } from "./array.js";
import { doT } from "./cat.js";
import { applicative as identityApp } from "./identity.js";
import {
    applyCartesian,
    atMay,
    choices,
    cmp,
    dec,
    drop,
    dropWhile,
    dropWhileEnd,
    elemIndex,
    elemIndices,
    elemIndicesLazy,
    empty,
    enc,
    equality,
    findIndex,
    findIndices,
    findIndicesLazy,
    foldL1,
    foldR1,
    fromIterable,
    fromOption,
    fromReduce,
    fromString,
    group,
    init,
    intercalate,
    interleave,
    interleaveTwoWay,
    intersperse,
    iota,
    last,
    monad,
    monoid,
    partialCmp,
    partialEqUnary,
    permutations,
    range,
    reduce,
    repeat,
    replicate,
    scanL,
    singleton,
    span,
    spanNot,
    splitAt,
    stripPrefix,
    subsequences,
    tail,
    take,
    takeWhile,
    toArray,
    toString,
    transpose,
    traversable,
    tupleCartesian,
    unfoldR,
    unique,
    unzip,
    zip3,
    zip4,
    zipWith,
} from "./list.js";
import {
    isNone,
    none,
    type Option,
    applicative as optionApp,
    map as optionMap,
    some,
} from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { unwrap } from "./result.js";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.js";
import { stringEq } from "./type-class/eq.js";
import { nonNanHash } from "./type-class/hash.js";
import { stringOrd } from "./type-class/ord.js";

test("with CatT", () => {
    // Find patterns where `x + y + z == 5` for all natural number `x`, `y`, and `z`.
    const patterns = doT(monad)
        .addM("x", range(0, 6))
        .addMWith("y", ({ x }) => range(0, 6 - x))
        .addWith("z", ({ x, y }) => 5 - (x + y))
        .finish(({ x, y, z }) => [x, y, z] as const);

    expect(toArray(patterns)).toStrictEqual([
        [0, 0, 5],
        [0, 1, 4],
        [0, 2, 3],
        [0, 3, 2],
        [0, 4, 1],
        [0, 5, 0],
        [1, 0, 4],
        [1, 1, 3],
        [1, 2, 2],
        [1, 3, 1],
        [1, 4, 0],
        [2, 0, 3],
        [2, 1, 2],
        [2, 2, 1],
        [2, 3, 0],
        [3, 0, 2],
        [3, 1, 1],
        [3, 2, 0],
        [4, 0, 1],
        [4, 1, 0],
        [5, 0, 0],
    ]);
});

test("fromIterable", () => {
    let list = fromIterable([3, 1, 4]);
    expect(list.current()).toStrictEqual(some(3));
    list = list.rest();
    expect(list.current()).toStrictEqual(some(1));
    list = list.rest();
    expect(list.current()).toStrictEqual(some(4));
    list = list.rest();
    expect(list.current()).toStrictEqual(none());
    list = list.rest();
    expect(list.current()).toStrictEqual(none());
});

test("equality", () => {
    const eq = equality(stringEq);

    expect(eq(fromIterable([]), fromIterable([]))).toStrictEqual(true);
    expect(eq(fromIterable(["0"]), fromIterable(["0"]))).toStrictEqual(true);
    expect(eq(fromIterable(["2"]), fromIterable(["2"]))).toStrictEqual(true);

    expect(eq(fromIterable([]), fromIterable(["1"]))).toStrictEqual(false);
    expect(eq(fromIterable(["1"]), fromIterable([]))).toStrictEqual(false);
    expect(eq(fromIterable(["0"]), fromIterable(["0", "3"]))).toStrictEqual(
        false,
    );
    expect(eq(fromIterable(["4", "0"]), fromIterable(["0"]))).toStrictEqual(
        false,
    );
});

test("partial order", () => {
    const cmp = partialCmp(stringOrd);

    expect(cmp(fromIterable([]), fromIterable([]))).toStrictEqual(
        some<Ordering>(equal),
    );
    expect(cmp(fromIterable(["0"]), fromIterable(["0"]))).toStrictEqual(
        some<Ordering>(equal),
    );
    expect(cmp(fromIterable(["2"]), fromIterable(["2"]))).toStrictEqual(
        some<Ordering>(equal),
    );

    expect(cmp(fromIterable([]), fromIterable(["1"]))).toStrictEqual(
        some<Ordering>(less),
    );
    expect(cmp(fromIterable(["0"]), fromIterable(["0", "3"]))).toStrictEqual(
        some<Ordering>(less),
    );
    expect(cmp(fromIterable(["1"]), fromIterable([]))).toStrictEqual(
        some<Ordering>(greater),
    );
    expect(cmp(fromIterable(["4", "0"]), fromIterable(["0"]))).toStrictEqual(
        some<Ordering>(greater),
    );
});

test("total order", () => {
    const totalCmp = cmp(stringOrd);

    expect(totalCmp(fromIterable([]), fromIterable([]))).toStrictEqual(equal);
    expect(totalCmp(fromIterable(["0"]), fromIterable(["0"]))).toStrictEqual(
        equal,
    );
    expect(totalCmp(fromIterable(["2"]), fromIterable(["2"]))).toStrictEqual(
        equal,
    );

    expect(totalCmp(fromIterable([]), fromIterable(["1"]))).toStrictEqual(less);
    expect(
        totalCmp(fromIterable(["0"]), fromIterable(["0", "3"])),
    ).toStrictEqual(less);
    expect(totalCmp(fromIterable(["1"]), fromIterable([]))).toStrictEqual(
        greater,
    );
    expect(
        totalCmp(fromIterable(["4", "0"]), fromIterable(["0"])),
    ).toStrictEqual(greater);
});

test("partial equality unary", () => {
    const lifted = partialEqUnary.liftEq(
        (l: number, r: number) => (l - r) % 2 === 0,
    );

    expect(lifted(fromIterable([]), fromIterable([]))).toStrictEqual(true);
    expect(
        lifted(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
            fromIterable([1, 0, 0, 1, 1, 0, 1]),
        ),
    ).toStrictEqual(true);
    expect(
        lifted(
            fromIterable([1, 0, 0, 1, 1, 0, 1]),
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
    ).toStrictEqual(true);

    expect(
        lifted(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
            fromIterable([1, 0, 0, 1, 1, 0]),
        ),
    ).toStrictEqual(false);
    expect(
        lifted(
            fromIterable([1, 0, 0, 1, 0, 1]),
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
    ).toStrictEqual(false);
});

test("repeat", () => {
    let inf = repeat(8);
    for (let i = 0; i < 1000; ++i) {
        expect(inf.current()).toStrictEqual(some(8));
        inf = inf.rest();
    }
});

test("iota", () => {
    let inf = iota;
    for (let i = 0; i < 1000; ++i) {
        expect(inf.current()).toStrictEqual(some(i));
        inf = inf.rest();
    }
});

test("fromString", () => {
    // deno-lint-ignore prefer-ascii
    const expected = fromIterable("こんにちは😃");
    // deno-lint-ignore prefer-ascii
    const actual = fromString("こんにちは😃");

    expect(equality(stringEq)(expected, actual)).toStrictEqual(true);
});

test("fromOption", () => {
    const fromSome = fromOption(some("foo"));
    const fromNone = fromOption<string>(none());

    expect(equality(stringEq)(fromIterable(["foo"]), fromSome)).toStrictEqual(
        true,
    );
    expect(equality(stringEq)(fromIterable([]), fromNone)).toStrictEqual(true);

    expect(equality(stringEq)(fromIterable(["foo"]), fromNone)).toStrictEqual(
        false,
    );
    expect(equality(stringEq)(fromIterable([]), fromSome)).toStrictEqual(false);
});

test("fromReduce", () => {
    const tree = Seq.fromArray([1, 4, 2, 3, 5, 2, 3]);

    expect(toArray(fromReduce(Seq.reduce)(tree))).toStrictEqual([
        1, 4, 2, 3, 5, 2, 3,
    ]);
});

test("foldL1", () => {
    const sub = (x: number) => (y: number) => x - y;

    expect(foldL1(sub)(fromIterable([2, 2, 4, 3, 5]))).toStrictEqual(-12);
    expect(() => {
        foldL1(sub)(empty());
    }).toThrow();
});

test("foldR1", () => {
    const sub = (x: number) => (y: number) => x - y;

    expect(foldR1(sub)(fromIterable([2, 2, 4, 3, 5]))).toStrictEqual(
        2 - (2 - (4 - (3 - 5))),
    );
    expect(() => {
        foldR1(sub)(empty());
    }).toThrow();
});

test("toString", () => {
    expect(toString(empty())).toStrictEqual("");

    const banana = fromIterable(["ba", "NaN", "a"]);
    expect(toString(banana)).toStrictEqual("baNaNa");
});

test("scanL", () => {
    const add = (x: number) => (y: number) => x + y;
    expect(toArray(take(5)(scanL(add)(0)(drop(1)(iota))))).toStrictEqual([
        0, 1, 3, 6, 10,
    ]);
});

test("last", () => {
    expect(last(empty())).toStrictEqual(none());
    expect(last(fromString("hoge"))).toStrictEqual(some("e"));

    const list = singleton(42);
    expect(last(list)).toStrictEqual(some(42));
    expect(last(list.rest())).toStrictEqual(none());
});

test("tail", () => {
    const banana = fromIterable(["ba", "NaN", "a"]);
    expect(toArray(tail(banana))).toStrictEqual(["NaN", "a"]);
});

test("init", () => {
    const banana = fromIterable(["ba", "NaN", "a"]);
    expect(toArray(init(banana))).toStrictEqual(["ba", "NaN"]);
});

test("multiple zip", () => {
    const threeNums = take(3)(zip3(iota)(drop(1)(iota))(drop(2)(iota)));
    expect(toArray(threeNums)).toStrictEqual([
        [0, 1, 2],
        [1, 2, 3],
        [2, 3, 4],
    ]);

    const fourNums = take(3)(
        zip4(iota)(drop(1)(iota))(drop(2)(iota))(drop(3)(iota)),
    );
    expect(toArray(fourNums)).toStrictEqual([
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
    ]);
});

test("zipWith", () => {
    const zipped = zipWith((x: number) => (y: number) => x * y)(iota)(
        fromIterable([1, 4, 2, 3, 5]),
    );
    expect(toArray(zipped)).toStrictEqual([0, 4, 4, 9, 20]);
});

test("unzip", () => {
    expect(
        unzip(fromIterable([] as readonly [number, string][])),
    ).toStrictEqual([empty(), empty()]);

    const [unzippedL, unzippedR] = unzip(
        fromIterable([
            [0, "foo"],
            [4, "vox"],
            [3, "wut"],
        ]),
    );
    expect(toArray(unzippedL)).toStrictEqual([0, 4, 3]);
    expect(toArray(unzippedR)).toStrictEqual(["foo", "vox", "wut"]);
});

test("intersperse", () => {
    const joined = intersperse(", ")(fromIterable(["Hello", "world!"]));
    expect(toArray(joined)).toStrictEqual(["Hello", ", ", "world!"]);
});

test("intercalate", () => {
    const joined = intercalate(fromString(" | "))(
        fromIterable([fromString("curl"), fromString("sh")]),
    );
    expect(toString(joined)).toStrictEqual("curl | sh");
});

test("transpose", () => {
    const transposed = transpose(
        fromIterable([take(3)(iota), take(3)(drop(1)(iota))]),
    );
    expect(toArray(monad.map(toArray)(transposed))).toStrictEqual([
        [0, 1],
        [1, 2],
        [2, 3],
    ]);
});

test("interleave", () => {
    const interleaved = interleave(
        fromIterable([take(3)(iota), take(3)(drop(1)(iota))]),
    );
    expect(toArray(interleaved)).toStrictEqual([0, 1, 1, 2, 2, 3]);
});

test("interleaveTwoWay", () => {
    const interleaved = interleaveTwoWay(take(3)(iota))(take(3)(drop(1)(iota)));
    expect(toArray(interleaved)).toStrictEqual([0, 1, 1, 2, 2, 3]);
});

test("subsequences", () => {
    const seq = subsequences(fromIterable([1, 4, 2, 3, 5]));
    expect(toArray(monad.map(toArray)(seq))).toStrictEqual([
        [],
        [1],
        [4],
        [1, 4],
        [2],
        [1, 2],
        [4, 2],
        [1, 4, 2],
        [3],
        [1, 3],
        [4, 3],
        [1, 4, 3],
        [2, 3],
        [1, 2, 3],
        [4, 2, 3],
        [1, 4, 2, 3],
        [5],
        [1, 5],
        [4, 5],
        [1, 4, 5],
        [2, 5],
        [1, 2, 5],
        [4, 2, 5],
        [1, 4, 2, 5],
        [3, 5],
        [1, 3, 5],
        [4, 3, 5],
        [1, 4, 3, 5],
        [2, 3, 5],
        [1, 2, 3, 5],
        [4, 2, 3, 5],
        [1, 4, 2, 3, 5],
    ]);
});

test("permutations", () => {
    const perms = permutations(take(4)(iota));
    expect(toArray(monad.map(toArray)(perms))).toStrictEqual([
        [0, 1, 2, 3],
        [1, 0, 2, 3],
        [2, 1, 0, 3],
        [1, 2, 0, 3],
        [2, 0, 1, 3],
        [0, 2, 1, 3],
        [3, 2, 1, 0],
        [2, 3, 1, 0],
        [2, 1, 3, 0],
        [3, 1, 2, 0],
        [1, 3, 2, 0],
        [1, 2, 3, 0],
        [3, 0, 1, 2],
        [0, 3, 1, 2],
        [0, 1, 3, 2],
        [3, 1, 0, 2],
        [1, 3, 0, 2],
        [1, 0, 3, 2],
        [3, 0, 2, 1],
        [0, 3, 2, 1],
        [0, 2, 3, 1],
        [3, 2, 0, 1],
        [2, 3, 0, 1],
        [2, 0, 3, 1],
    ]);
});

test("unfoldR", () => {
    const decrement = (n: number): Option<[number, number]> => {
        if (n === 0) {
            return none();
        }
        return some([n, n - 1]);
    };
    expect(toArray(unfoldR(decrement)(10))).toStrictEqual([
        10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);
});

test("splitAt", () => {
    {
        const [left, right] = splitAt(2)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        expect(toArray(left)).toStrictEqual([1, 4]);
        expect(toArray(right)).toStrictEqual([2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = splitAt(0)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        expect(toArray(left)).toStrictEqual([]);
        expect(toArray(right)).toStrictEqual([1, 4, 2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = splitAt(7)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        expect(toArray(left)).toStrictEqual([1, 4, 2, 3, 5, 2, 3]);
        expect(toArray(right)).toStrictEqual([]);
    }
});

test("replicate", () => {
    const beast = replicate(3)(6);
    expect(toArray(beast)).toStrictEqual([6, 6, 6]);
});

test("atMay", () => {
    const nums = take(5)(iota);

    expect(atMay(0)(nums)).toStrictEqual(some(0));
    expect(atMay(4)(nums)).toStrictEqual(some(4));
    expect(isNone(atMay(-1)(nums))).toStrictEqual(true);
    expect(isNone(atMay(5)(nums))).toStrictEqual(true);
});

test("findIndex", () => {
    const found = findIndex((x: number) => x >= 2 && x % 2 === 1)(iota);
    expect(found).toStrictEqual(some(3));

    expect(findIndex((x: number) => x > 4)(fromIterable([0, 1]))).toStrictEqual(
        none(),
    );
});

test("elemIndex", () => {
    const applied = elemIndex(stringEq)("foo");
    expect(applied(fromIterable(["foo"]))).toStrictEqual(some(0));
    expect(applied(fromIterable(["foo", "bar"]))).toStrictEqual(some(0));
    expect(applied(fromIterable(["bar", "foo"]))).toStrictEqual(some(1));
    expect(applied(fromIterable(["bar"]))).toStrictEqual(none());
});

test("findIndices", () => {
    const indices = findIndices((x: number) => x % 2 === 0)(take(10)(iota));
    expect(indices).toStrictEqual([0, 2, 4, 6, 8]);
});

test("findIndicesLazy", () => {
    const indices = findIndicesLazy((x: number) => x % 2 === 0)(take(10)(iota));
    expect(toArray(indices)).toStrictEqual([0, 2, 4, 6, 8]);
});

test("elemIndices", () => {
    expect(elemIndices(stringEq)("xxx")(fromIterable(["xxx"]))).toStrictEqual([
        0,
    ]);
    expect(
        elemIndices(stringEq)("xxx")(
            fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
        ),
    ).toStrictEqual([2, 4]);
    expect(
        elemIndices(stringEq)("xxx")(fromIterable(["xx", "xxxx", "x"])),
    ).toStrictEqual([]);
    expect(elemIndices(stringEq)("xxx")(fromIterable([]))).toStrictEqual([]);
});

test("elemIndicesLazy", () => {
    expect(
        toArray(elemIndicesLazy(stringEq)("xxx")(fromIterable(["xxx"]))),
    ).toStrictEqual([0]);
    expect(
        toArray(
            elemIndicesLazy(stringEq)("xxx")(
                fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
            ),
        ),
    ).toStrictEqual([2, 4]);
    expect(
        toArray(
            elemIndicesLazy(stringEq)("xxx")(fromIterable(["xx", "xxxx", "x"])),
        ),
    ).toStrictEqual([]);
    expect(
        toArray(elemIndicesLazy(stringEq)("xxx")(fromIterable([]))),
    ).toStrictEqual([]);
});

test("takeWhile", () => {
    expect(toArray(takeWhile((x: number) => x * x <= 10)(iota))).toStrictEqual([
        0, 1, 2, 3,
    ]);
});

test("dropWhile", () => {
    expect(
        toArray(dropWhile((x: number) => x < 5)(fromIterable([4, 1, 5, 2, 3]))),
    ).toStrictEqual([5, 2, 3]);
});

test("dropWhileEnd", () => {
    expect(
        toArray(
            dropWhileEnd((x: number) => x < 3)(
                fromIterable([1, 2, 3, 4, 5, 1, 2]),
            ),
        ),
    ).toStrictEqual([1, 2, 3, 4, 5]);
    expect(
        toArray(dropWhileEnd((x: number) => x < 9)(fromIterable([1, 2, 3]))),
    ).toStrictEqual([]);
});

test("span", () => {
    {
        const [left, right] = span((x: number) => x < 3)(
            fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        expect(toArray(left)).toStrictEqual([1, 2]);
        expect(toArray(right)).toStrictEqual([3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = span((x: number) => x < 9)(
            fromIterable([1, 2, 3]),
        );
        expect(toArray(left)).toStrictEqual([1, 2, 3]);
        expect(toArray(right)).toStrictEqual([]);
    }
    {
        const [left, right] = span((x: number) => x < 0)(
            fromIterable([1, 2, 3]),
        );
        expect(toArray(left)).toStrictEqual([]);
        expect(toArray(right)).toStrictEqual([1, 2, 3]);
    }
});

test("spanNot", () => {
    {
        const [left, right] = spanNot((x: number) => x < 3)(
            fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        expect(toArray(left)).toStrictEqual([]);
        expect(toArray(right)).toStrictEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = spanNot((x: number) => x < 9)(
            fromIterable([1, 2, 3]),
        );
        expect(toArray(left)).toStrictEqual([]);
        expect(toArray(right)).toStrictEqual([1, 2, 3]);
    }
    {
        const [left, right] = spanNot((x: number) => x < 0)(
            fromIterable([1, 2, 3]),
        );
        expect(toArray(left)).toStrictEqual([1, 2, 3]);
        expect(toArray(right)).toStrictEqual([]);
    }
});

test("stripPrefix", () => {
    const stripFoo = stripPrefix(stringEq)(fromString("foo"));
    {
        const optList = stripFoo(fromString("foobar"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toStrictEqual(some("bar"));
    }
    {
        const optList = stripFoo(fromString("foo"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toStrictEqual(some(""));
    }
    {
        const optList = stripFoo(fromString("barfoo"));
        const optStr = optionMap(toString)(optList);
        expect(optStr).toStrictEqual(none());
    }
});

test("group", () => {
    const grouped = toArray(group(stringEq)(fromString("Mississippi"))).map(
        (list) => toString(list),
    );
    expect(grouped).toStrictEqual(["M", "i", "ss", "i", "ss", "i", "pp", "i"]);
});

test("unique", () => {
    const uniqueNums = unique(nonNanHash)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
    expect(toArray(uniqueNums)).toStrictEqual([1, 4, 2, 3, 5]);
});

test("tupleCartesian", () => {
    const deltas = tupleCartesian(range(-1, 2))(range(-1, 2));
    expect(toArray(deltas)).toStrictEqual([
        [-1, -1],
        [-1, 0],
        [0, -1],
        [-1, 1],
        [0, 0],
        [1, -1],
        [0, 1],
        [1, 0],
        [1, 1],
    ]);
});

test("applyCartesian", () => {
    const applied = applyCartesian(
        fromIterable([(x: number) => x + 1, (x: number) => x * 2]),
    )(range(3, 6));
    expect(toArray(applied)).toStrictEqual([4, 5, 6, 6, 8, 10]);
});

test("choices", () => {
    const choice = choices(fromIterable([range(0, 3), range(3, 6)]));
    const sequences = toArray(choice).map(toArray);
    expect(sequences).toStrictEqual([
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

test("monoid", () => {
    const m = monoid<number>();

    // associative
    {
        const x = range(1, 4);
        const y = range(2, 3);
        const z = range(5, 8);
        expect(toArray(m.combine(m.combine(x, y), z))).toStrictEqual(
            toArray(m.combine(x, m.combine(y, z))),
        );
    }

    // identity
    {
        const x = range(1, 4);
        expect(toArray(m.combine(x, m.identity))).toStrictEqual(toArray(x));
        expect(toArray(m.combine(m.identity, x))).toStrictEqual(toArray(x));
    }
});

test("traversable functor", () => {
    // naturality
    const first = <T>(x: readonly T[]): Option<T> =>
        0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    const data = fromString("fever");
    expect(
        optionMap(toArray)(first(traversable.traverse(arrayApp)(dup)(data))),
    ).toStrictEqual(
        optionMap(toArray)(
            traversable.traverse(optionApp)((item: string) => first(dup(item)))(
                data,
            ),
        ),
    );

    // identity
    const nums = range(0, 5);
    expect(
        toArray(traversable.traverse(identityApp)((a: number) => a)(nums)),
    ).toStrictEqual(toArray(nums));

    // composition
    const app = Compose.applicative(arrayApp)(optionApp);
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    const x = fromString("nice");
    expect(
        traversable
            .traverse(app)((item: string) => arrayApp.map(firstCh)(dup(item)))(
                x,
            )
            .map(optionMap(toArray)),
    ).toStrictEqual(
        arrayApp
            .map(traversable.traverse(optionApp)(firstCh))(
                traversable.traverse(arrayApp)(dup)(x),
            )
            .map(optionMap(toArray)),
    );
});

test("reduce functor", () => {
    const sub = (x: number) => (y: number) => x - y;
    {
        const actual = reduce.reduceR(sub)(fromIterable([1, 4, 2, 3, 5, 2, 3]))(
            0,
        );
        expect(actual).toStrictEqual(2);
        expect(reduce.reduceR(sub)(empty())(0)).toStrictEqual(0);
    }
    {
        const actual = reduce.reduceL(sub)(0)(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        expect(actual).toStrictEqual(-20);
        expect(reduce.reduceL(sub)(0)(empty())).toStrictEqual(0);
    }
});

test("encode then decode", () => {
    const data = fromIterable([1, 4, 2, 3, 5, 2, 3]);
    const code = runCode(enc(encU32Be)(data));
    const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
    expect(toArray(decoded)).toStrictEqual(toArray(data));
});
