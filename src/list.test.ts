import { assertEquals, assertThrows } from "../deps.ts";
import { doT } from "./cat.ts";
import {
    applicative as optionApp,
    isNone,
    map as optionMap,
    none,
    type Option,
    some,
} from "./option.ts";
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
} from "./list.ts";
import { stringEq } from "./type-class/eq.ts";
import { stringOrd } from "./type-class/ord.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { Compose, Seq } from "../mod.ts";
import { applicative as arrayApp } from "./array.ts";
import { applicative as identityApp } from "./identity.ts";
import { decU32Be, encU32Be, runCode, runDecoder } from "./serial.ts";
import { unwrap } from "./result.ts";
import { nonNanHash } from "./type-class/hash.ts";

Deno.test("with CatT", () => {
    // Find patterns where `x + y + z == 5` for all natural number `x`, `y`, and `z`.
    const patterns = doT(monad)
        .addM("x", range(0, 6))
        .addMWith("y", ({ x }) => range(0, 6 - x))
        .addWith("z", ({ x, y }) => 5 - (x + y))
        .finish(({ x, y, z }) => [x, y, z] as const);

    assertEquals(toArray(patterns), [
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

Deno.test("fromIterable", () => {
    let list = fromIterable([3, 1, 4]);
    assertEquals(list.current(), some(3));
    list = list.rest();
    assertEquals(list.current(), some(1));
    list = list.rest();
    assertEquals(list.current(), some(4));
    list = list.rest();
    assertEquals(list.current(), none());
    list = list.rest();
    assertEquals(list.current(), none());
});

Deno.test("equality", () => {
    const eq = equality(stringEq);

    assertEquals(eq(fromIterable([]), fromIterable([])), true);
    assertEquals(eq(fromIterable(["0"]), fromIterable(["0"])), true);
    assertEquals(eq(fromIterable(["2"]), fromIterable(["2"])), true);

    assertEquals(eq(fromIterable([]), fromIterable(["1"])), false);
    assertEquals(eq(fromIterable(["1"]), fromIterable([])), false);
    assertEquals(eq(fromIterable(["0"]), fromIterable(["0", "3"])), false);
    assertEquals(eq(fromIterable(["4", "0"]), fromIterable(["0"])), false);
});

Deno.test("partial order", () => {
    const cmp = partialCmp(stringOrd);

    assertEquals(
        cmp(fromIterable([]), fromIterable([])),
        some<Ordering>(equal),
    );
    assertEquals(
        cmp(fromIterable(["0"]), fromIterable(["0"])),
        some<Ordering>(equal),
    );
    assertEquals(
        cmp(fromIterable(["2"]), fromIterable(["2"])),
        some<Ordering>(equal),
    );

    assertEquals(
        cmp(fromIterable([]), fromIterable(["1"])),
        some<Ordering>(less),
    );
    assertEquals(
        cmp(fromIterable(["0"]), fromIterable(["0", "3"])),
        some<Ordering>(less),
    );
    assertEquals(
        cmp(fromIterable(["1"]), fromIterable([])),
        some<Ordering>(greater),
    );
    assertEquals(
        cmp(fromIterable(["4", "0"]), fromIterable(["0"])),
        some<Ordering>(greater),
    );
});

Deno.test("total order", () => {
    const totalCmp = cmp(stringOrd);

    assertEquals(
        totalCmp(fromIterable([]), fromIterable([])),
        equal,
    );
    assertEquals(
        totalCmp(fromIterable(["0"]), fromIterable(["0"])),
        equal,
    );
    assertEquals(
        totalCmp(fromIterable(["2"]), fromIterable(["2"])),
        equal,
    );

    assertEquals(
        totalCmp(fromIterable([]), fromIterable(["1"])),
        less,
    );
    assertEquals(
        totalCmp(fromIterable(["0"]), fromIterable(["0", "3"])),
        less,
    );
    assertEquals(
        totalCmp(fromIterable(["1"]), fromIterable([])),
        greater,
    );
    assertEquals(
        totalCmp(fromIterable(["4", "0"]), fromIterable(["0"])),
        greater,
    );
});

Deno.test("partial equality unary", () => {
    const lifted = partialEqUnary.liftEq((l: number, r: number) =>
        (l - r) % 2 === 0
    );

    assertEquals(lifted(fromIterable([]), fromIterable([])), true);
    assertEquals(
        lifted(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
            fromIterable([1, 0, 0, 1, 1, 0, 1]),
        ),
        true,
    );
    assertEquals(
        lifted(
            fromIterable([1, 0, 0, 1, 1, 0, 1]),
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
        true,
    );

    assertEquals(
        lifted(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
            fromIterable([1, 0, 0, 1, 1, 0]),
        ),
        false,
    );
    assertEquals(
        lifted(
            fromIterable([1, 0, 0, 1, 0, 1]),
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        ),
        false,
    );
});

Deno.test("repeat", () => {
    let inf = repeat(8);
    for (let i = 0; i < 1000; ++i) {
        assertEquals(inf.current(), some(8));
        inf = inf.rest();
    }
});

Deno.test("iota", () => {
    let inf = iota;
    for (let i = 0; i < 1000; ++i) {
        assertEquals(inf.current(), some(i));
        inf = inf.rest();
    }
});

Deno.test("fromString", () => {
    // deno-lint-ignore prefer-ascii
    const expected = fromIterable("こんにちは😃");
    // deno-lint-ignore prefer-ascii
    const actual = fromString("こんにちは😃");

    assertEquals(
        equality(stringEq)(expected, actual),
        true,
    );
});

Deno.test("fromOption", () => {
    const fromSome = fromOption(some("foo"));
    const fromNone = fromOption<string>(none());

    assertEquals(
        equality(stringEq)(fromIterable(["foo"]), fromSome),
        true,
    );
    assertEquals(
        equality(stringEq)(fromIterable([]), fromNone),
        true,
    );

    assertEquals(
        equality(stringEq)(fromIterable(["foo"]), fromNone),
        false,
    );
    assertEquals(
        equality(stringEq)(fromIterable([]), fromSome),
        false,
    );
});

Deno.test("fromReduce", () => {
    const tree = Seq.fromArray([1, 4, 2, 3, 5, 2, 3]);

    assertEquals(
        toArray(fromReduce(Seq.reduce)(tree)),
        [1, 4, 2, 3, 5, 2, 3],
    );
});

Deno.test("foldL1", () => {
    const sub = (x: number) => (y: number) => x - y;

    assertEquals(
        foldL1(sub)(fromIterable([2, 2, 4, 3, 5])),
        -12,
    );
    assertThrows(() => {
        foldL1(sub)(empty());
    });
});

Deno.test("foldR1", () => {
    const sub = (x: number) => (y: number) => x - y;

    assertEquals(
        foldR1(sub)(fromIterable([2, 2, 4, 3, 5])),
        2 - (2 - (4 - (3 - 5))),
    );
    assertThrows(() => {
        foldR1(sub)(empty());
    });
});

Deno.test("toString", () => {
    assertEquals(toString(empty()), "");

    const banana = fromIterable(["ba", "NaN", "a"]);
    assertEquals(toString(banana), "baNaNa");
});

Deno.test("scanL", () => {
    const add = (x: number) => (y: number) => x + y;
    assertEquals(toArray(take(5)(scanL(add)(0)(drop(1)(iota)))), [
        0,
        1,
        3,
        6,
        10,
    ]);
});

Deno.test("last", () => {
    assertEquals(last(empty()), none());
    assertEquals(last(fromString("hoge")), some("e"));

    const list = singleton(42);
    assertEquals(last(list), some(42));
    assertEquals(last(list.rest()), none());
});

Deno.test("tail", () => {
    const banana = fromIterable(["ba", "NaN", "a"]);
    assertEquals(toArray(tail(banana)), ["NaN", "a"]);
});

Deno.test("init", () => {
    const banana = fromIterable(["ba", "NaN", "a"]);
    assertEquals(toArray(init(banana)), ["ba", "NaN"]);
});

Deno.test("multiple zip", () => {
    const threeNums = take(3)(zip3(iota)(drop(1)(iota))(drop(2)(iota)));
    assertEquals(toArray(threeNums), [[0, 1, 2], [1, 2, 3], [2, 3, 4]]);

    const fourNums = take(3)(
        zip4(iota)(drop(1)(iota))(drop(2)(iota))(drop(3)(iota)),
    );
    assertEquals(toArray(fourNums), [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5]]);
});

Deno.test("zipWith", () => {
    const zipped = zipWith((x: number) => (y: number) => x * y)(iota)(
        fromIterable([1, 4, 2, 3, 5]),
    );
    assertEquals(toArray(zipped), [0, 4, 4, 9, 20]);
});

Deno.test("unzip", () => {
    assertEquals(
        unzip(fromIterable([] as readonly [number, string][])),
        [empty(), empty()],
    );

    const [unzippedL, unzippedR] = unzip(
        fromIterable([[0, "foo"], [4, "vox"], [3, "wut"]]),
    );
    assertEquals(toArray(unzippedL), [0, 4, 3]);
    assertEquals(toArray(unzippedR), ["foo", "vox", "wut"]);
});

Deno.test("intersperse", () => {
    const joined = intersperse(", ")(fromIterable(["Hello", "world!"]));
    assertEquals(toArray(joined), ["Hello", ", ", "world!"]);
});

Deno.test("intercalate", () => {
    const joined = intercalate(fromString(" | "))(
        fromIterable([fromString("curl"), fromString("sh")]),
    );
    assertEquals(toString(joined), "curl | sh");
});

Deno.test("transpose", () => {
    const transposed = transpose(
        fromIterable([take(3)(iota), take(3)(drop(1)(iota))]),
    );
    assertEquals(toArray(monad.map(toArray)(transposed)), [
        [0, 1],
        [1, 2],
        [2, 3],
    ]);
});

Deno.test("interleave", () => {
    const interleaved = interleave(
        fromIterable([take(3)(iota), take(3)(drop(1)(iota))]),
    );
    assertEquals(toArray(interleaved), [
        0,
        1,
        1,
        2,
        2,
        3,
    ]);
});

Deno.test("interleaveTwoWay", () => {
    const interleaved = interleaveTwoWay(take(3)(iota))(take(3)(drop(1)(iota)));
    assertEquals(toArray(interleaved), [
        0,
        1,
        1,
        2,
        2,
        3,
    ]);
});

Deno.test("subsequences", () => {
    const seq = subsequences(fromIterable([1, 4, 2, 3, 5]));
    assertEquals(
        toArray(monad.map(toArray)(seq)),
        [
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
        ],
    );
});

Deno.test("permutations", () => {
    const perms = permutations(take(4)(iota));
    assertEquals(toArray(monad.map(toArray)(perms)), [
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

Deno.test("unfoldR", () => {
    const decrement = (n: number): Option<[number, number]> => {
        if (n === 0) {
            return none();
        }
        return some([n, n - 1]);
    };
    assertEquals(toArray(unfoldR(decrement)(10)), [
        10,
        9,
        8,
        7,
        6,
        5,
        4,
        3,
        2,
        1,
    ]);
});

Deno.test("splitAt", () => {
    {
        const [left, right] = splitAt(2)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        assertEquals(toArray(left), [1, 4]);
        assertEquals(toArray(right), [2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = splitAt(0)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        assertEquals(toArray(left), []);
        assertEquals(toArray(right), [1, 4, 2, 3, 5, 2, 3]);
    }

    {
        const [left, right] = splitAt(7)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
        assertEquals(toArray(left), [1, 4, 2, 3, 5, 2, 3]);
        assertEquals(toArray(right), []);
    }
});

Deno.test("replicate", () => {
    const beast = replicate(3)(6);
    assertEquals(toArray(beast), [6, 6, 6]);
});

Deno.test("atMay", () => {
    const nums = take(5)(iota);

    assertEquals(atMay(0)(nums), some(0));
    assertEquals(atMay(4)(nums), some(4));
    assertEquals(isNone(atMay(-1)(nums)), true);
    assertEquals(isNone(atMay(5)(nums)), true);
});

Deno.test("findIndex", () => {
    const found = findIndex((x: number) => x >= 2 && x % 2 === 1)(iota);
    assertEquals(found, some(3));

    assertEquals(findIndex((x: number) => x > 4)(fromIterable([0, 1])), none());
});

Deno.test("elemIndex", () => {
    const applied = elemIndex(stringEq)("foo");
    assertEquals(applied(fromIterable(["foo"])), some(0));
    assertEquals(applied(fromIterable(["foo", "bar"])), some(0));
    assertEquals(applied(fromIterable(["bar", "foo"])), some(1));
    assertEquals(applied(fromIterable(["bar"])), none());
});

Deno.test("findIndices", () => {
    const indices = findIndices((x: number) => x % 2 === 0)(take(10)(iota));
    assertEquals(indices, [0, 2, 4, 6, 8]);
});

Deno.test("findIndicesLazy", () => {
    const indices = findIndicesLazy((x: number) => x % 2 === 0)(take(10)(iota));
    assertEquals(toArray(indices), [0, 2, 4, 6, 8]);
});

Deno.test("elemIndices", () => {
    assertEquals(elemIndices(stringEq)("xxx")(fromIterable(["xxx"])), [0]);
    assertEquals(
        elemIndices(stringEq)("xxx")(
            fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
        ),
        [2, 4],
    );
    assertEquals(
        elemIndices(stringEq)("xxx")(fromIterable(["xx", "xxxx", "x"])),
        [],
    );
    assertEquals(elemIndices(stringEq)("xxx")(fromIterable([])), []);
});

Deno.test("elemIndicesLazy", () => {
    assertEquals(
        toArray(elemIndicesLazy(stringEq)("xxx")(fromIterable(["xxx"]))),
        [0],
    );
    assertEquals(
        toArray(
            elemIndicesLazy(stringEq)("xxx")(
                fromIterable(["xx", "xxxx", "xxx", "x", "xxx"]),
            ),
        ),
        [2, 4],
    );
    assertEquals(
        toArray(
            elemIndicesLazy(stringEq)("xxx")(fromIterable(["xx", "xxxx", "x"])),
        ),
        [],
    );
    assertEquals(
        toArray(elemIndicesLazy(stringEq)("xxx")(fromIterable([]))),
        [],
    );
});

Deno.test("takeWhile", () => {
    assertEquals(toArray(takeWhile((x: number) => x * x <= 10)(iota)), [
        0,
        1,
        2,
        3,
    ]);
});

Deno.test("dropWhile", () => {
    assertEquals(
        toArray(dropWhile((x: number) => x < 5)(fromIterable([4, 1, 5, 2, 3]))),
        [5, 2, 3],
    );
});

Deno.test("dropWhileEnd", () => {
    assertEquals(
        toArray(
            dropWhileEnd((x: number) => x < 3)(
                fromIterable([1, 2, 3, 4, 5, 1, 2]),
            ),
        ),
        [1, 2, 3, 4, 5],
    );
    assertEquals(
        toArray(dropWhileEnd((x: number) => x < 9)(fromIterable([1, 2, 3]))),
        [],
    );
});

Deno.test("span", () => {
    {
        const [left, right] = span((x: number) => x < 3)(
            fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        assertEquals(toArray(left), [1, 2]);
        assertEquals(toArray(right), [3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = span((x: number) => x < 9)(
            fromIterable([1, 2, 3]),
        );
        assertEquals(toArray(left), [1, 2, 3]);
        assertEquals(toArray(right), []);
    }
    {
        const [left, right] = span((x: number) => x < 0)(
            fromIterable([1, 2, 3]),
        );
        assertEquals(toArray(left), []);
        assertEquals(toArray(right), [1, 2, 3]);
    }
});

Deno.test("spanNot", () => {
    {
        const [left, right] = spanNot((x: number) => x < 3)(
            fromIterable([1, 2, 3, 4, 1, 2, 3, 4]),
        );
        assertEquals(toArray(left), []);
        assertEquals(toArray(right), [1, 2, 3, 4, 1, 2, 3, 4]);
    }
    {
        const [left, right] = spanNot((x: number) => x < 9)(
            fromIterable([1, 2, 3]),
        );
        assertEquals(toArray(left), []);
        assertEquals(toArray(right), [1, 2, 3]);
    }
    {
        const [left, right] = spanNot((x: number) => x < 0)(
            fromIterable([1, 2, 3]),
        );
        assertEquals(toArray(left), [1, 2, 3]);
        assertEquals(toArray(right), []);
    }
});

Deno.test("stripPrefix", () => {
    const stripFoo = stripPrefix(stringEq)(fromString("foo"));
    {
        const optList = stripFoo(fromString("foobar"));
        const optStr = optionMap(toString)(optList);
        assertEquals(optStr, some("bar"));
    }
    {
        const optList = stripFoo(fromString("foo"));
        const optStr = optionMap(toString)(optList);
        assertEquals(optStr, some(""));
    }
    {
        const optList = stripFoo(fromString("barfoo"));
        const optStr = optionMap(toString)(optList);
        assertEquals(optStr, none());
    }
});

Deno.test("group", () => {
    const grouped = toArray(group(stringEq)(fromString("Mississippi")))
        .map((list) => toString(list));
    assertEquals(grouped, ["M", "i", "ss", "i", "ss", "i", "pp", "i"]);
});

Deno.test("unique", () => {
    const uniqueNums = unique(nonNanHash)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
    assertEquals(toArray(uniqueNums), [1, 4, 2, 3, 5]);
});

Deno.test("tupleCartesian", () => {
    const deltas = tupleCartesian(range(-1, 2))(range(-1, 2));
    assertEquals(toArray(deltas), [
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

Deno.test("applyCartesian", () => {
    const applied = applyCartesian(
        fromIterable([(x: number) => x + 1, (x: number) => x * 2]),
    )(range(3, 6));
    assertEquals(toArray(applied), [4, 5, 6, 6, 8, 10]);
});

Deno.test("choices", () => {
    const choice = choices(fromIterable([range(0, 3), range(3, 6)]));
    const sequences = toArray(choice).map(toArray);
    assertEquals(sequences, [
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

Deno.test("monoid", () => {
    const m = monoid<number>();

    // associative
    {
        const x = range(1, 4);
        const y = range(2, 3);
        const z = range(5, 8);
        assertEquals(
            toArray(m.combine(m.combine(x, y), z)),
            toArray(m.combine(x, m.combine(y, z))),
        );
    }

    // identity
    {
        const x = range(1, 4);
        assertEquals(
            toArray(m.combine(x, m.identity)),
            toArray(x),
        );
        assertEquals(
            toArray(m.combine(m.identity, x)),
            toArray(x),
        );
    }
});

Deno.test("traversable functor", () => {
    // naturality
    const first = <T>(
        x: readonly T[],
    ): Option<T> => 0 in x ? some(x[0]) : none();
    const dup = (x: string): readonly string[] => [x + "0", x + "1"];
    const data = fromString("fever");
    assertEquals(
        optionMap(toArray)(first(traversable.traverse(arrayApp)(dup)(data))),
        optionMap(toArray)(
            traversable.traverse(optionApp)((item: string) => first(dup(item)))(
                data,
            ),
        ),
    );

    // identity
    const nums = range(0, 5);
    assertEquals(
        toArray(traversable.traverse(identityApp)((a: number) => a)(nums)),
        toArray(nums),
    );

    // composition
    const app = Compose.applicative(arrayApp)(optionApp);
    const firstCh = (x: string): Option<string> =>
        x.length > 0 ? some(x.charAt(0)) : none();
    const x = fromString("nice");
    assertEquals(
        traversable.traverse(app)((item: string) =>
            arrayApp.map(firstCh)(dup(item))
        )(x).map(optionMap(toArray)),
        arrayApp.map(traversable.traverse(optionApp)(firstCh))(
            traversable.traverse(arrayApp)(dup)(x),
        ).map(optionMap(toArray)),
    );
});

Deno.test("reduce functor", () => {
    const sub = (x: number) => (y: number) => x - y;
    {
        const actual = reduce.reduceR(sub)(fromIterable([1, 4, 2, 3, 5, 2, 3]))(
            0,
        );
        assertEquals(actual, 2);
        assertEquals(reduce.reduceR(sub)(empty())(0), 0);
    }
    {
        const actual = reduce.reduceL(sub)(0)(
            fromIterable([1, 4, 2, 3, 5, 2, 3]),
        );
        assertEquals(actual, -20);
        assertEquals(reduce.reduceL(sub)(0)(empty()), 0);
    }
});

Deno.test("encode then decode", async () => {
    const data = fromIterable([1, 4, 2, 3, 5, 2, 3]);
    const code = await runCode(enc(encU32Be)(data));
    const decoded = unwrap(runDecoder(dec(decU32Be()))(code));
    assertEquals(toArray(decoded), toArray(data));
});
