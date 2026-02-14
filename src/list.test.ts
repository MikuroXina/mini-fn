import { expect, test } from "vitest";
import { applicative as arrayApp } from "./array.js";
import { doT } from "./cat.js";
import * as Compose from "./compose.js";
import { applicative as identityApp } from "./identity.js";
import * as List from "./list.js";
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
import * as Seq from "./seq.js";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.js";
import { stringEq } from "./type-class/eq.js";
import { nonNanHash } from "./type-class/hash.js";
import { stringOrd } from "./type-class/ord.js";

test("with CatT", () => {
    // Find patterns where `x + y + z == 5` for all natural number `x`, `y`, and `z`.
    const patterns = doT(List.monad)
        .addM("x", List.range(0, 6))
        .addMWith("y", ({ x }) => List.range(0, 6 - x))
        .addWith("z", ({ x, y }) => 5 - (x + y))
        .finish(({ x, y, z }) => [x, y, z] as const);

    expect(List.toArray(patterns)).toStrictEqual([
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
    let list = List.fromIterable([3, 1, 4]);
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
    const eq = List.equality(stringEq);

    expect(eq(List.fromIterable([]), List.fromIterable([]))).toStrictEqual(
        true,
    );
    expect(
        eq(List.fromIterable(["0"]), List.fromIterable(["0"])),
    ).toStrictEqual(true);
    expect(
        eq(List.fromIterable(["2"]), List.fromIterable(["2"])),
    ).toStrictEqual(true);

    expect(eq(List.fromIterable([]), List.fromIterable(["1"]))).toStrictEqual(
        false,
    );
    expect(eq(List.fromIterable(["1"]), List.fromIterable([]))).toStrictEqual(
        false,
    );
    expect(
        eq(List.fromIterable(["0"]), List.fromIterable(["0", "3"])),
    ).toStrictEqual(false);
    expect(
        eq(List.fromIterable(["4", "0"]), List.fromIterable(["0"])),
    ).toStrictEqual(false);
});

test("partial order", () => {
    const cmp = List.partialCmp(stringOrd);

    expect(cmp(List.fromIterable([]), List.fromIterable([]))).toStrictEqual(
        some<Ordering>(equal),
    );
    expect(
        cmp(List.fromIterable(["0"]), List.fromIterable(["0"])),
    ).toStrictEqual(some<Ordering>(equal));
    expect(
        cmp(List.fromIterable(["2"]), List.fromIterable(["2"])),
    ).toStrictEqual(some<Ordering>(equal));

    expect(cmp(List.fromIterable([]), List.fromIterable(["1"]))).toStrictEqual(
        some<Ordering>(less),
    );
    expect(
        cmp(List.fromIterable(["0"]), List.fromIterable(["0", "3"])),
    ).toStrictEqual(some<Ordering>(less));
    expect(cmp(List.fromIterable(["1"]), List.fromIterable([]))).toStrictEqual(
        some<Ordering>(greater),
    );
    expect(
        cmp(List.fromIterable(["4", "0"]), List.fromIterable(["0"])),
    ).toStrictEqual(some<Ordering>(greater));
});

test("total order", () => {
    const totalCmp = List.cmp(stringOrd);

    expect(
        totalCmp(List.fromIterable([]), List.fromIterable([])),
    ).toStrictEqual(equal);
    expect(
        totalCmp(List.fromIterable(["0"]), List.fromIterable(["0"])),
    ).toStrictEqual(equal);
    expect(
        totalCmp(List.fromIterable(["2"]), List.fromIterable(["2"])),
    ).toStrictEqual(equal);

    expect(
        totalCmp(List.fromIterable([]), List.fromIterable(["1"])),
    ).toStrictEqual(less);
    expect(
        totalCmp(List.fromIterable(["0"]), List.fromIterable(["0", "3"])),
    ).toStrictEqual(less);
    expect(
        totalCmp(List.fromIterable(["1"]), List.fromIterable([])),
    ).toStrictEqual(greater);
    expect(
        totalCmp(List.fromIterable(["4", "0"]), List.fromIterable(["0"])),
    ).toStrictEqual(greater);
});

test("partial equality unary", () => {
    const lifted = List.partialEqUnary.liftEq(
        (l: number, r: number) => (l - r) % 2 === 0,
    );

    expect(lifted(List.fromIterable([]), List.fromIterable([]))).toStrictEqual(
        true,
    );
    expect(
        lifted(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
            List.fromIterable([1, 0, 0, 1, 1, 0, 1]),
        ),
    ).toStrictEqual(true);
    expect(
        lifted(
            List.fromIterable([1, 0, 0, 1, 1, 0, 1]),
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
    ).toStrictEqual(true);

    expect(
        lifted(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
            List.fromIterable([1, 0, 0, 1, 1, 0]),
        ),
    ).toStrictEqual(false);
    expect(
        lifted(
            List.fromIterable([1, 0, 0, 1, 0, 1]),
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
    ).toStrictEqual(false);
});

test("repeat", () => {
    let inf = List.repeat(8);
    for (let i = 0; i < 1000; ++i) {
        expect(inf.current()).toStrictEqual(some(8));
        inf = inf.rest();
    }
});

test("iota", () => {
    let inf = List.iota;
    for (let i = 0; i < 1000; ++i) {
        expect(inf.current()).toStrictEqual(some(i));
        inf = inf.rest();
    }
});

test("fromString", () => {
    const expected = List.fromIterable("こんにちは😃");
    const actual = List.fromString("こんにちは😃");

    expect(List.equality(stringEq)(expected, actual)).toStrictEqual(true);
});

test("fromOption", () => {
    const fromSome = List.fromOption(some("foo"));
    const fromNone = List.fromOption<string>(none());

    expect(
        List.equality(stringEq)(List.fromIterable(["foo"]), fromSome),
    ).toStrictEqual(true);
    expect(
        List.equality(stringEq)(List.fromIterable([]), fromNone),
    ).toStrictEqual(true);

    expect(
        List.equality(stringEq)(List.fromIterable(["foo"]), fromNone),
    ).toStrictEqual(false);
    expect(
        List.equality(stringEq)(List.fromIterable([]), fromSome),
    ).toStrictEqual(false);
});

test("fromReduce", () => {
    const tree = Seq.fromArray([1, 4, 2, 3, 5, 2, 3]);

    expect(List.toArray(List.fromReduce(Seq.reduce)(tree))).toStrictEqual([
        1, 4, 2, 3, 5, 2, 3,
    ]);
});

test("foldL1", () => {
    const sub = (x: number) => (y: number) => x - y;

    expect(List.foldL1(sub)(List.fromIterable([2, 2, 4, 3, 5]))).toStrictEqual(
        -12,
    );
    expect(() => {
        List.foldL1(sub)(List.empty());
    }).toThrow();
});

test("foldR1", () => {
    const sub = (x: number) => (y: number) => x - y;

    expect(List.foldR1(sub)(List.fromIterable([2, 2, 4, 3, 5]))).toStrictEqual(
        2 - (2 - (4 - (3 - 5))),
    );
    expect(() => {
        List.foldR1(sub)(List.empty());
    }).toThrow();
});

test("toString", () => {
    expect(List.toString(List.empty())).toStrictEqual("");

    const banana = List.fromIterable(["ba", "NaN", "a"]);
    expect(List.toString(banana)).toStrictEqual("baNaNa");
});

test("scanL", () => {
    const add = (x: number) => (y: number) => x + y;
    expect(
        List.toArray(List.take(5)(List.scanL(add)(0)(List.drop(1)(List.iota)))),
    ).toStrictEqual([0, 1, 3, 6, 10]);
});

test("last", () => {
    expect(List.last(List.empty())).toStrictEqual(none());
    expect(List.last(List.fromString("hoge"))).toStrictEqual(some("e"));

    const list = List.singleton(42);
    expect(List.last(list)).toStrictEqual(some(42));
    expect(List.last(list.rest())).toStrictEqual(none());
});

test("tail", () => {
    const banana = List.fromIterable(["ba", "NaN", "a"]);
    expect(List.toArray(List.tail(banana))).toStrictEqual(["NaN", "a"]);
});

test("init", () => {
    const banana = List.fromIterable(["ba", "NaN", "a"]);
    expect(List.toArray(List.init(banana))).toStrictEqual(["ba", "NaN"]);
});

test("multiple zip", () => {
    const threeNums = List.take(3)(
        List.zip3(List.iota)(List.drop(1)(List.iota))(List.drop(2)(List.iota)),
    );
    expect(List.toArray(threeNums)).toStrictEqual([
        [0, 1, 2],
        [1, 2, 3],
        [2, 3, 4],
    ]);

    const fourNums = List.take(3)(
        List.zip4(List.iota)(List.drop(1)(List.iota))(List.drop(2)(List.iota))(
            List.drop(3)(List.iota),
        ),
    );
    expect(List.toArray(fourNums)).toStrictEqual([
        [0, 1, 2, 3],
        [1, 2, 3, 4],
        [2, 3, 4, 5],
    ]);
});

test("zipWith", () => {
    const zipped = List.zipWith((x: number) => (y: number) => x * y)(List.iota)(
        List.fromIterable([1, 4, 2, 3, 5]),
    );
    expect(List.toArray(zipped)).toStrictEqual([0, 4, 4, 9, 20]);
});

test("unzip", () => {
    expect(
        List.unzip(List.fromIterable([] as readonly [number, string][])),
    ).toStrictEqual([List.empty(), List.empty()]);

    const [unzippedL, unzippedR] = List.unzip(
        List.fromIterable([
            [0, "foo"],
            [4, "vox"],
            [3, "wut"],
        ]),
    );
    expect(List.toArray(unzippedL)).toStrictEqual([0, 4, 3]);
    expect(List.toArray(unzippedR)).toStrictEqual(["foo", "vox", "wut"]);
});

test("intersperse", () => {
    const joined = List.intersperse(", ")(
        List.fromIterable(["Hello", "world!"]),
    );
    expect(List.toArray(joined)).toStrictEqual(["Hello", ", ", "world!"]);
});

test("intercalate", () => {
    const joined = List.intercalate(List.fromString(" | "))(
        List.fromIterable([List.fromString("curl"), List.fromString("sh")]),
    );
    expect(List.toString(joined)).toStrictEqual("curl | sh");
});

test("transpose", () => {
    const transposed = List.transpose(
        List.fromIterable([
            List.take(3)(List.iota),
            List.take(3)(List.drop(1)(List.iota)),
        ]),
    );
    expect(
        List.toArray(List.monad.map(List.toArray)(transposed)),
    ).toStrictEqual([
        [0, 1],
        [1, 2],
        [2, 3],
    ]);
});

test("interleave", () => {
    const interleaved = List.interleave(
        List.fromIterable([
            List.take(3)(List.iota),
            List.take(3)(List.drop(1)(List.iota)),
        ]),
    );
    expect(List.toArray(interleaved)).toStrictEqual([0, 1, 1, 2, 2, 3]);
});

test("interleaveTwoWay", () => {
    const interleaved = List.interleaveTwoWay(List.take(3)(List.iota))(
        List.take(3)(List.drop(1)(List.iota)),
    );
    expect(List.toArray(interleaved)).toStrictEqual([0, 1, 1, 2, 2, 3]);
});

test("subsequences", () => {
    const seq = List.subsequences(List.fromIterable([1, 4, 2, 3, 5]));
    expect(List.toArray(List.monad.map(List.toArray)(seq))).toStrictEqual([
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
    const perms = List.permutations(List.take(4)(List.iota));
    expect(List.toArray(List.monad.map(List.toArray)(perms))).toStrictEqual([
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
    expect(List.toArray(List.unfoldR(decrement)(10))).toStrictEqual([
        10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);
});

test("splitAt", () => {
    {
        const [left, right] = List.splitAt(2)(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([1, 4]);
        expect(List.toArray(right)).toStrictEqual([2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = List.splitAt(0)(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([]);
        expect(List.toArray(right)).toStrictEqual([1, 4, 2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = List.splitAt(7)(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([1, 4, 2, 3, 5, 2, 3]);
        expect(List.toArray(right)).toStrictEqual([]);
    }
});

test("replicate", () => {
    const beast = List.replicate(3)(6);
    expect(List.toArray(beast)).toStrictEqual([6, 6, 6]);
});

test("atMay", () => {
    const nums = List.take(5)(List.iota);

    expect(List.atMay(0)(nums)).toStrictEqual(some(0));
    expect(List.atMay(4)(nums)).toStrictEqual(some(4));
    expect(isNone(List.atMay(-1)(nums))).toStrictEqual(true);
    expect(isNone(List.atMay(5)(nums))).toStrictEqual(true);
});

test("findIndex", () => {
    const found = List.findIndex((x: number) => x >= 2 && x % 2 === 1)(
        List.iota,
    );
    expect(found).toStrictEqual(some(3));

    expect(
        List.findIndex((x: number) => x > 4)(List.fromIterable([0, 1])),
    ).toStrictEqual(none());
});

test("elemIndex", () => {
    const applied = List.elemIndex(stringEq)("foo");
    expect(applied(List.fromIterable(["foo"]))).toStrictEqual(some(0));
    expect(applied(List.fromIterable(["foo", "bar"]))).toStrictEqual(some(0));
    expect(applied(List.fromIterable(["bar", "foo"]))).toStrictEqual(some(1));
    expect(applied(List.fromIterable(["bar"]))).toStrictEqual(none());
});

test("findIndices", () => {
    const indices = List.findIndices((x: number) => x % 2 === 0)(
        List.take(10)(List.iota),
    );
    expect(indices).toStrictEqual([0, 2, 4, 6, 8]);
});

test("findIndicesLazy", () => {
    const indices = List.findIndicesLazy((x: number) => x % 2 === 0)(
        List.take(10)(List.iota),
    );
    expect(List.toArray(indices)).toStrictEqual([0, 2, 4, 6, 8]);
});

test("elemIndices", () => {
    expect(
        List.elemIndices(stringEq)("xxx")(List.fromIterable(["xxx"])),
    ).toStrictEqual([0]);
    expect(
        List.elemIndices(stringEq)("xxx")(
            List.fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
        ),
    ).toStrictEqual([2, 4]);
    expect(
        List.elemIndices(stringEq)("xxx")(
            List.fromIterable(["xx", "xxxx", "x"]),
        ),
    ).toStrictEqual([]);
    expect(
        List.elemIndices(stringEq)("xxx")(List.fromIterable([])),
    ).toStrictEqual([]);
});

test("elemIndicesLazy", () => {
    expect(
        List.toArray(
            List.elemIndicesLazy(stringEq)("xxx")(List.fromIterable(["xxx"])),
        ),
    ).toStrictEqual([0]);
    expect(
        List.toArray(
            List.elemIndicesLazy(stringEq)("xxx")(
                List.fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
            ),
        ),
    ).toStrictEqual([2, 4]);
    expect(
        List.toArray(
            List.elemIndicesLazy(stringEq)("xxx")(
                List.fromIterable(["xx", "xxxx", "x"]),
            ),
        ),
    ).toStrictEqual([]);
    expect(
        List.toArray(
            List.elemIndicesLazy(stringEq)("xxx")(List.fromIterable([])),
        ),
    ).toStrictEqual([]);
});

test("takeWhile", () => {
    expect(
        List.toArray(List.takeWhile((x: number) => x * x <= 10)(List.iota)),
    ).toStrictEqual([0, 1, 2, 3]);
});

test("dropWhile", () => {
    expect(
        List.toArray(
            List.dropWhile((x: number) => x < 5)(
                List.fromIterable([4, 1, 5, 2, 3]),
            ),
        ),
    ).toStrictEqual([5, 2, 3]);
});

test("dropWhileEnd", () => {
    expect(
        List.toArray(
            List.dropWhileEnd((x: number) => x < 3)(
                List.fromIterable([1, 2, 3, 4, 5, 1, 2]),
            ),
        ),
    ).toStrictEqual([1, 2, 3, 4, 5]);
    expect(
        List.toArray(
            List.dropWhileEnd((x: number) => x < 9)(
                List.fromIterable([1, 2, 3]),
            ),
        ),
    ).toStrictEqual([]);
});

test("span", () => {
    {
        const [left, right] = List.span((x: number) => x < 3)(
            List.fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        expect(List.toArray(left)).toStrictEqual([1, 2]);
        expect(List.toArray(right)).toStrictEqual([3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = List.span((x: number) => x < 9)(
            List.fromIterable([1, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([1, 2, 3]);
        expect(List.toArray(right)).toStrictEqual([]);
    }
    {
        const [left, right] = List.span((x: number) => x < 0)(
            List.fromIterable([1, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([]);
        expect(List.toArray(right)).toStrictEqual([1, 2, 3]);
    }
});

test("spanNot", () => {
    {
        const [left, right] = List.spanNot((x: number) => x < 3)(
            List.fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        expect(List.toArray(left)).toStrictEqual([]);
        expect(List.toArray(right)).toStrictEqual([1, 2, 3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = List.spanNot((x: number) => x < 9)(
            List.fromIterable([1, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([]);
        expect(List.toArray(right)).toStrictEqual([1, 2, 3]);
    }
    {
        const [left, right] = List.spanNot((x: number) => x < 0)(
            List.fromIterable([1, 2, 3]),
        );
        expect(List.toArray(left)).toStrictEqual([1, 2, 3]);
        expect(List.toArray(right)).toStrictEqual([]);
    }
});

test("stripPrefix", () => {
    const stripFoo = List.stripPrefix(stringEq)(List.fromString("foo"));
    {
        const optList = stripFoo(List.fromString("foobar"));
        const optStr = optionMap(List.toString)(optList);
        expect(optStr).toStrictEqual(some("bar"));
    }
    {
        const optList = stripFoo(List.fromString("foo"));
        const optStr = optionMap(List.toString)(optList);
        expect(optStr).toStrictEqual(some(""));
    }
    {
        const optList = stripFoo(List.fromString("barfoo"));
        const optStr = optionMap(List.toString)(optList);
        expect(optStr).toStrictEqual(none());
    }
});

test("group", () => {
    const grouped = List.toArray(
        List.group(stringEq)(List.fromString("Mississippi")),
    ).map((list) => List.toString(list));
    expect(grouped).toStrictEqual(["M", "i", "ss", "i", "ss", "i", "pp", "i"]);
});

test("unique", () => {
    const uniqueNums = List.unique(nonNanHash)(
        List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
    );
    expect(List.toArray(uniqueNums)).toStrictEqual([1, 4, 2, 3, 5]);
});

test("tupleCartesian", () => {
    const deltas = List.tupleCartesian(List.range(-1, 2))(List.range(-1, 2));
    expect(List.toArray(deltas)).toStrictEqual([
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
    const applied = List.applyCartesian(
        List.fromIterable([(x: number) => x + 1, (x: number) => x * 2]),
    )(List.range(3, 6));
    expect(List.toArray(applied)).toStrictEqual([4, 5, 6, 6, 8, 10]);
});

test("choices", () => {
    const choice = List.choices(
        List.fromIterable([List.range(0, 3), List.range(3, 6)]),
    );
    const sequences = List.toArray(choice).map(List.toArray);
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
    const m = List.monoid<number>();

    // associative
    {
        const x = List.range(1, 4);
        const y = List.range(2, 3);
        const z = List.range(5, 8);
        expect(List.toArray(m.combine(m.combine(x, y), z))).toStrictEqual(
            List.toArray(m.combine(x, m.combine(y, z))),
        );
    }

    // identity
    {
        const x = List.range(1, 4);
        expect(List.toArray(m.combine(x, m.identity))).toStrictEqual(
            List.toArray(x),
        );
        expect(List.toArray(m.combine(m.identity, x))).toStrictEqual(
            List.toArray(x),
        );
    }
});

test("traversable functor", () => {
    // naturality
    const first = <T>(x: readonly T[]): Option<T> =>
        0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [`${x}0`, `${x}1`];
    const data = List.fromString("fever");
    expect(
        optionMap(List.toArray)(
            first(List.traversable.traverse(arrayApp)(dup)(data)),
        ),
    ).toStrictEqual(
        optionMap(List.toArray)(
            List.traversable.traverse(optionApp)((item: string) =>
                first(dup(item)),
            )(data),
        ),
    );

    // identity
    const nums = List.range(0, 5);
    expect(
        List.toArray(
            List.traversable.traverse(identityApp)((a: number) => a)(nums),
        ),
    ).toStrictEqual(List.toArray(nums));

    // composition
    const app = Compose.applicative(arrayApp)(optionApp);
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    const x = List.fromString("nice");
    expect(
        List.traversable
            .traverse(app)((item: string) => arrayApp.map(firstCh)(dup(item)))(
                x,
            )
            .map(optionMap(List.toArray)),
    ).toStrictEqual(
        arrayApp
            .map(List.traversable.traverse(optionApp)(firstCh))(
                List.traversable.traverse(arrayApp)(dup)(x),
            )
            .map(optionMap(List.toArray)),
    );
});

test("alternative functor laws", () => {
    const a = List.alternative;
    // associativity
    const l012 = List.take(3)(List.iota);
    const l23 = List.take(2)(List.drop(2)(List.iota));
    const l01 = List.take(2)(List.iota);
    expect(List.toArray(a.alt(a.alt(l012)(l23))(l01))).toStrictEqual(
        List.toArray(a.alt(l012)(a.alt(l23)(l01))),
    );

    // distributivity
    const adds = List.fromIterable([
        (x: number) => x + 2,
        (x: number) => x + 3,
    ]);
    const prods = List.fromIterable([
        (x: number) => x * 2,
        (x: number) => x * 3,
    ]);
    const l01234 = List.take(5)(List.iota);
    expect(List.toArray(a.apply(a.alt(adds)(prods))(l01234))).toStrictEqual(
        List.toArray(a.alt(a.apply(adds)(l01234))(a.apply(prods)(l01234))),
    );

    // left identity
    expect(List.toArray(a.alt(a.empty<number>())(l01234))).toStrictEqual(
        List.toArray(l01234),
    );

    // right identity
    expect(List.toArray(a.alt(l01234)(a.empty()))).toStrictEqual(
        List.toArray(l01234),
    );

    // annihilation
    expect(
        List.toArray(a.apply(a.empty<(x: number) => number>())(l01234)),
    ).toStrictEqual(List.toArray(a.empty()));
});

test("reduce functor", () => {
    const sub = (x: number) => (y: number) => x - y;
    {
        const actual = List.reduce.reduceR(sub)(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        )(0);
        expect(actual).toStrictEqual(2);
        expect(List.reduce.reduceR(sub)(List.empty())(0)).toStrictEqual(0);
    }
    {
        const actual = List.reduce.reduceL(sub)(0)(
            List.fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        expect(actual).toStrictEqual(-20);
        expect(List.reduce.reduceL(sub)(0)(List.empty())).toStrictEqual(0);
    }
});

test("encode then decode", () => {
    const data = List.fromIterable([1, 4, 2, 3, 5, 2, 3]);
    const code = runCode(List.enc(encU32Be)(data));
    const decoded = unwrap(runDecoder(List.dec(decU32Be()))(code));
    expect(List.toArray(decoded)).toStrictEqual(List.toArray(data));
});
