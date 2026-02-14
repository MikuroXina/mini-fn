import { expect, test } from "vitest";
import { ord as bigintOrd } from "./big-int.js";
import * as BTree from "./btree.js";
import { doT } from "./cat.js";
import * as Option from "./option.js";
import { none } from "./option.js";
import { fromTo, fromToInclusive, since, until } from "./range.js";
import * as State from "./state.js";
import { ord as stringOrd } from "./string.js";

test("movie review example", () => {
    const ord = stringOrd;
    const add = BTree.insert(ord);
    const getMovieReviews = doT(State.monad<BTree.Map<string, string>>())
        .addM(
            "_",
            add("Office Space")("Deals with real issues in the workplace."),
        )
        .addM("_", add("Pulp Fiction")("Masterpiece."))
        .addM("_", add("The Godfather")("Very enjoyable."))
        .addM("_", add("The Blues Brothers")("Eye lyked it a lot."))
        .finishM(State.get<BTree.Map<string, string>>);
    const movieReviews = State.executeState(getMovieReviews)(BTree.newMap());

    expect(BTree.containsKey(ord)("Office Space")(movieReviews)).toStrictEqual(
        true,
    );
    expect(
        BTree.containsKey(ord)("The Blues Brothers")(movieReviews),
    ).toStrictEqual(true);
    expect(
        BTree.containsKey(ord)("Les Misérables")(movieReviews),
    ).toStrictEqual(false);

    const [removed, movieReviews2] =
        BTree.remove(ord)("The Blues Brothers")(movieReviews);

    expect(removed).toStrictEqual(Option.some("Eye lyked it a lot."));
    expect(
        BTree.containsKey(ord)("The Blues Brothers")(movieReviews),
    ).toStrictEqual(true);
    expect(
        BTree.containsKey(ord)("The Blues Brothers")(movieReviews2),
    ).toStrictEqual(false);
    expect(BTree.len(movieReviews2)).toStrictEqual(3);

    expect([...BTree.toIterator(movieReviews2)]).toStrictEqual([
        ["Office Space", "Deals with real issues in the workplace."],
        ["Pulp Fiction", "Masterpiece."],
        ["The Godfather", "Very enjoyable."],
    ]);
});

test("range", () => {
    const ord = bigintOrd;
    const add = BTree.insert(ord);
    const [map] = doT(State.monad<BTree.Map<bigint, string>>())
        .addM("_", add(3n)("a"))
        .addM("_", add(5n)("b"))
        .addM("_", add(8n)("c"))
        .addM("_", add(9n)("d"))
        .finishM(State.get<BTree.Map<bigint, string>>)(BTree.newMap());

    const actual = [...BTree.range(ord)(fromToInclusive(4n, 8n))(map)];

    expect(actual).toStrictEqual([
        [5n, "b"],
        [8n, "c"],
    ]);
});

test("fromIterable", () => {
    const map = BTree.fromIterable(stringOrd)([
        ["one", 1],
        ["one", 11],
        ["two", 22],
        ["two", 2],
        ["three", 3],
        ["for", 4],
    ]);

    expect([...BTree.toIterator(map)]).toStrictEqual([
        ["for", 4],
        ["one", 11],
        ["three", 3],
        ["two", 2],
    ]);
});
test("isEmpty", () => {
    expect(BTree.isEmpty(BTree.newMap())).toStrictEqual(true);
    expect(BTree.isEmpty(BTree.fromIterable(stringOrd)([]))).toStrictEqual(
        true,
    );

    const map = BTree.fromIterable(stringOrd)([["xyz", 123]]);
    expect(BTree.isEmpty(map)).toStrictEqual(false);

    const [, removed] = BTree.remove(stringOrd)("xyz")(map);
    expect(BTree.isEmpty(removed)).toStrictEqual(true);
});
test("insert and remove many items", () => {
    let map = BTree.newMap<string, number>();
    for (let i = 0; i < 200; ++i) {
        [, map] = BTree.insert(stringOrd)(`${i}`)(i)(map);
        [, map] = BTree.insert(stringOrd)(`${i}`)(i)(map);
    }

    expect(BTree.containsKey(stringOrd)("-1")(map)).toStrictEqual(false);
    for (let i = 0; i < 200; ++i) {
        expect(BTree.containsKey(stringOrd)(`${i}`)(map)).toStrictEqual(true);
    }
    expect(BTree.containsKey(stringOrd)("200")(map)).toStrictEqual(false);

    expect([...BTree.toRevIterator(map)]).toStrictEqual(
        [...new Array(200)]
            .map((_, i) => 200 - 1 - i)
            .toSorted((a, b) => stringOrd.cmp(`${b}`, `${a}`))
            .map((i) => [`${i}`, i]),
    );

    expect([...BTree.range(stringOrd)(fromTo("13", "14"))(map)]).toStrictEqual([
        ["13", 13],
        ["130", 130],
        ["131", 131],
        ["132", 132],
        ["133", 133],
        ["134", 134],
        ["135", 135],
        ["136", 136],
        ["137", 137],
        ["138", 138],
        ["139", 139],
    ]);

    const verify = <V>(map: BTree.Map<string, V>) => {
        const keys = [...BTree.toKeys(map)];
        expect(keys).toStrictEqual(keys.toSorted(stringOrd.cmp));
    };

    for (let i = 0; i < 200; ++i) {
        [, map] = BTree.remove(stringOrd)(`${i}`)(map);
        verify(map);
    }

    for (let i = 0; i < 200; ++i) {
        expect(BTree.containsKey(stringOrd)(`${i}`)(map)).toStrictEqual(false);
    }
});
test("remove to empty", () => {
    expect(BTree.remove(stringOrd)("foo")(BTree.newMap())).toStrictEqual([
        none(),
        BTree.newMap(),
    ]);
});

const abcMap = doT(State.monad<BTree.Map<string, number>>())
    .addM("_", BTree.insert(stringOrd)("a")(1))
    .addM("_", BTree.insert(stringOrd)("b")(2))
    .addM("_", BTree.insert(stringOrd)("c")(3))
    .finishM(State.get<BTree.Map<string, number>>)(BTree.newMap())[0];

test("toRevIterator", () => {
    expect([...BTree.toRevIterator(abcMap)]).toStrictEqual([
        ["c", 3],
        ["b", 2],
        ["a", 1],
    ]);
});
test("toKeys", () => {
    expect([...BTree.toKeys(abcMap)]).toStrictEqual(["a", "b", "c"]);
});
test("toValues", () => {
    expect([...BTree.toValues(abcMap)]).toStrictEqual([1, 2, 3]);
});
test("firstKeyValue", () => {
    expect(BTree.firstKeyValue(abcMap)).toStrictEqual(Option.some(["a", 1]));
    expect(BTree.firstKeyValue(BTree.newMap())).toStrictEqual(Option.none());
});
test("lastKeyValue", () => {
    expect(BTree.lastKeyValue(abcMap)).toStrictEqual(Option.some(["c", 3]));
    expect(BTree.lastKeyValue(BTree.newMap())).toStrictEqual(Option.none());
});
test("popFirstKeyValue", () => {
    const [popped, after] = BTree.popFirstKeyValue(stringOrd)(abcMap);

    expect([...BTree.toIterator(after)]).toStrictEqual([
        ["b", 2],
        ["c", 3],
    ]);
    expect(popped).toStrictEqual(Option.some(["a", 1]));

    expect(BTree.popFirstKeyValue(stringOrd)(BTree.newMap())).toStrictEqual([
        Option.none(),
        BTree.newMap(),
    ]);
});
test("popLastKeyValue", () => {
    const [popped, after] = BTree.popLastKeyValue(stringOrd)(abcMap);

    expect([...BTree.toIterator(after)]).toStrictEqual([
        ["a", 1],
        ["b", 2],
    ]);
    expect(popped).toStrictEqual(Option.some(["c", 3]));

    expect(BTree.popLastKeyValue(stringOrd)(BTree.newMap())).toStrictEqual([
        Option.none(),
        BTree.newMap(),
    ]);
});
test("range for more bounds cases", () => {
    expect([...BTree.range(stringOrd)(since("d"))(abcMap)]).toStrictEqual([]);
    expect([...BTree.range(stringOrd)(until("9"))(abcMap)]).toStrictEqual([]);

    expect([
        ...BTree.range(stringOrd)(fromTo("a", "z"))(BTree.newMap()),
    ]).toStrictEqual([]);
});
test("reduceR", () => {
    expect(
        BTree.reduceR((a: number) => (b: string) => `${a}:${b}`)(abcMap)(""),
    ).toStrictEqual("1:2:3:");
    expect(
        BTree.reduceR((a: number) => (b: string) => `${a}:${b}`)(
            BTree.newMap(),
        )(""),
    ).toStrictEqual("");
});
test("reduceL", () => {
    expect(
        BTree.reduceL((b: string) => (a: number) => `${b}:${a}`)("")(abcMap),
    ).toStrictEqual(":1:2:3");
    expect(
        BTree.reduceL((b: string) => (a: number) => `${b}:${a}`)("")(
            BTree.newMap(),
        ),
    ).toStrictEqual("");
});

const oneToFive = BTree.setFromIterable(bigintOrd)([
    1n,
    4n,
    2n,
    3n,
    5n,
    2n,
    3n,
]);
test("setToIterator", () => {
    expect([...BTree.setToIterator(BTree.newSet())]).toStrictEqual([]);
    expect([...BTree.setToIterator(oneToFive)]).toStrictEqual([
        1n,
        2n,
        3n,
        4n,
        5n,
    ]);
});
test("setToRevIterator", () => {
    expect([...BTree.setToRevIterator(BTree.newSet())]).toStrictEqual([]);
    expect([...BTree.setToRevIterator(oneToFive)]).toStrictEqual([
        5n,
        4n,
        3n,
        2n,
        1n,
    ]);
});
test("has", () => {
    for (let i = 1n; i <= 5n; ++i) {
        expect(BTree.has(bigintOrd)(i)(oneToFive)).toStrictEqual(true);
    }
    expect(BTree.has(bigintOrd)(0n)(oneToFive)).toStrictEqual(false);
    expect(BTree.has(bigintOrd)(6n)(oneToFive)).toStrictEqual(false);
});
test("first", () => {
    expect(BTree.first(BTree.newSet())).toStrictEqual(Option.none());
    expect(BTree.first(oneToFive)).toStrictEqual(Option.some(1n));
});
test("last", () => {
    expect(BTree.last(BTree.newSet())).toStrictEqual(Option.none());
    expect(BTree.last(oneToFive)).toStrictEqual(Option.some(5n));
});
test("push", () => {
    let map = BTree.newSet<bigint>();
    for (const x of [2n, 1n, 8n, 2n, 8n]) {
        map = BTree.push(bigintOrd)(x)(map);
    }

    const items = [...BTree.setToIterator(map)];
    expect(items).toStrictEqual(items.toSorted(bigintOrd.cmp));
});
test("pop", () => {
    expect(BTree.pop(bigintOrd)(1n)(BTree.newSet())).toStrictEqual(
        BTree.newSet(),
    );

    const modified = BTree.pop(bigintOrd)(1n)(oneToFive);
    expect([...BTree.setToIterator(modified)]).toStrictEqual([2n, 3n, 4n, 5n]);
});
test("popFirst", () => {
    expect(BTree.popFirst(bigintOrd)(BTree.newSet())).toStrictEqual([
        Option.none(),
        BTree.newSet(),
    ]);

    const [popped, modified] = BTree.popFirst(bigintOrd)(oneToFive);
    expect(popped).toStrictEqual(Option.some(1n));
    expect([...BTree.setToIterator(modified)]).toStrictEqual([2n, 3n, 4n, 5n]);
});
test("popLast", () => {
    expect(BTree.popLast(bigintOrd)(BTree.newSet())).toStrictEqual([
        Option.none(),
        BTree.newSet(),
    ]);

    const [popped, modified] = BTree.popLast(bigintOrd)(oneToFive);
    expect(popped).toStrictEqual(Option.some(5n));
    expect([...BTree.setToIterator(modified)]).toStrictEqual([1n, 2n, 3n, 4n]);
});

test("union", () => {
    const left = BTree.setFromIterable(bigintOrd)([6n, 6n, 1n, 2n, 1n]);
    const right = BTree.setFromIterable(bigintOrd)([1n, 3n, 5n, 2n]);

    const combined = BTree.union(bigintOrd)(right)(left);

    expect([...combined]).toStrictEqual([1n, 2n, 3n, 5n, 6n]);
});
test("symmetricDifference", () => {
    const left = BTree.setFromIterable(bigintOrd)([6n, 6n, 1n, 2n, 1n]);
    const right = BTree.setFromIterable(bigintOrd)([1n, 3n, 5n, 2n]);

    expect([
        ...BTree.symmetricDifference(bigintOrd)(right)(left),
    ]).toStrictEqual([3n, 5n, 6n]);
    expect([
        ...BTree.symmetricDifference(bigintOrd)(left)(right),
    ]).toStrictEqual([3n, 5n, 6n]);
});
test("difference", () => {
    const set126 = BTree.setFromIterable(bigintOrd)([6n, 6n, 1n, 2n, 1n]);
    const set1235 = BTree.setFromIterable(bigintOrd)([1n, 3n, 5n, 2n]);
    const set67 = BTree.setFromIterable(bigintOrd)([7n, 6n]);
    const setLarge = BTree.setFromIterable(bigintOrd)(
        [...new Array(80)].map((_, i) => BigInt(i) + 30n),
    );

    expect([...BTree.difference(bigintOrd)(set1235)(set126)]).toStrictEqual([
        6n,
    ]);
    expect([...BTree.difference(bigintOrd)(set126)(set1235)]).toStrictEqual([
        3n,
        5n,
    ]);
    expect([
        ...BTree.difference(bigintOrd)(BTree.newSet())(set126),
    ]).toStrictEqual([...BTree.setToIterator(set126)]);
    expect([
        ...BTree.difference(bigintOrd)(set1235)(BTree.newSet()),
    ]).toStrictEqual([]);

    expect([...BTree.difference(bigintOrd)(set1235)(set67)]).toStrictEqual([
        6n,
        7n,
    ]);
    expect([...BTree.difference(bigintOrd)(set67)(set1235)]).toStrictEqual([
        1n,
        2n,
        3n,
        5n,
    ]);
    expect([...BTree.difference(bigintOrd)(set126)(set67)]).toStrictEqual([7n]);
    expect([...BTree.difference(bigintOrd)(set67)(set126)]).toStrictEqual([
        1n,
        2n,
    ]);
    expect([...BTree.difference(bigintOrd)(setLarge)(set67)]).toStrictEqual([
        6n,
        7n,
    ]);
});
test("intersection", () => {
    const left = BTree.setFromIterable(bigintOrd)([6n, 6n, 1n, 2n, 1n]);
    const right = BTree.setFromIterable(bigintOrd)([1n, 3n, 5n, 2n]);

    const combined = BTree.intersection(bigintOrd)(right)(left);

    expect([...combined]).toStrictEqual([1n, 2n]);
});

test("isDisjoint", () => {
    const a = BTree.setFromIterable(bigintOrd)([1n, 2n, 3n]);

    let b = BTree.newSet<bigint>();
    expect(BTree.isDisjoint(bigintOrd)(b)(a)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(4n)(b);
    expect(BTree.isDisjoint(bigintOrd)(b)(a)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(1n)(b);
    expect(BTree.isDisjoint(bigintOrd)(b)(a)).toStrictEqual(false);
});
test("isSubset", () => {
    const a = BTree.setFromIterable(bigintOrd)([1n, 2n, 3n]);

    let b = BTree.newSet<bigint>();
    expect(BTree.isSubset(bigintOrd)(a)(b)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(1n)(b);
    expect(BTree.isSubset(bigintOrd)(a)(b)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(4n)(b);
    expect(BTree.isSubset(bigintOrd)(a)(b)).toStrictEqual(false);
});
test("isSuperset", () => {
    const a = BTree.setFromIterable(bigintOrd)([1n, 2n, 3n]);

    let b = BTree.newSet<bigint>();
    expect(BTree.isSuperset(bigintOrd)(b)(a)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(1n)(b);
    expect(BTree.isSuperset(bigintOrd)(b)(a)).toStrictEqual(true);

    b = BTree.push(bigintOrd)(4n)(b);
    expect(BTree.isSuperset(bigintOrd)(b)(a)).toStrictEqual(false);
});

test("Monoid laws on unionMonoid", () => {
    const m = BTree.unionMonoid(bigintOrd);

    const x = BTree.setFromIterable(bigintOrd)([4n, 6n, 1n, 3n, 9n]);
    const y = BTree.setFromIterable(bigintOrd)([2n, 2n, 2n]);
    const z = BTree.setFromIterable(bigintOrd)([1n, 5n, 1n, 8n, 1n]);
    // associative
    expect([
        ...BTree.setToIterator(m.combine(m.combine(x, y), z)),
    ]).toStrictEqual([...BTree.setToIterator(m.combine(x, m.combine(y, z)))]);

    // identity
    for (const s of [x, y, z]) {
        expect([
            ...BTree.setToIterator(m.combine(s, m.identity)),
        ]).toStrictEqual([...BTree.setToIterator(m.combine(m.identity, s))]);
    }
});

test("setReduceR", () => {
    expect(
        BTree.setReduceR((a: bigint) => (b: string) => `${a}:${b}`)(oneToFive)(
            "",
        ),
    ).toStrictEqual("1:2:3:4:5:");
    expect(
        BTree.reduceR((a: bigint) => (b: string) => `${a}:${b}`)(
            BTree.newMap(),
        )(""),
    ).toStrictEqual("");
});
test("setReduceL", () => {
    expect(
        BTree.setReduceL((b: string) => (a: bigint) => `${b}:${a}`)("")(
            oneToFive,
        ),
    ).toStrictEqual(":1:2:3:4:5");
    expect(
        BTree.reduceL((b: string) => (a: bigint) => `${b}:${a}`)("")(
            BTree.newMap(),
        ),
    ).toStrictEqual("");
});

test("steal from left at fromIterable", () => {
    const set = BTree.setFromIterable(stringOrd)(
        [...new Array(11 * (6 + 1) + (6 + 1))].map((_, i) => `${i}`),
    );

    const actual = [...BTree.setToIterator(set)];
    expect(actual).toStrictEqual(actual.toSorted(stringOrd.cmp));
});
