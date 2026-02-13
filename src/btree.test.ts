import { expect, test } from "vitest";
import { ord as bigintOrd } from "./big-int.js";
import * as BTree from "./btree.js";
import { doT } from "./cat.js";
import * as Option from "./option.js";
import { none } from "./option.js";
import { fromToInclusive, since, until } from "./range.js";
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
    }

    expect(BTree.containsKey(stringOrd)("-1")(map)).toStrictEqual(false);
    for (let i = 0; i < 200; ++i) {
        expect(BTree.containsKey(stringOrd)(`${i}`)(map)).toStrictEqual(true);
    }
    expect(BTree.containsKey(stringOrd)("200")(map)).toStrictEqual(false);

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

    const combined = BTree.symmetricDifference(bigintOrd)(right)(left);

    expect([...combined]).toStrictEqual([3n, 5n, 6n]);
});
// test("difference", () => {});
// test("intersection", () => {});
// test("isDisjoint", () => {});
// test("isSubset", () => {});
// test("isSuperset", () => {});

// test("Monoid laws on unionMonoid", () => {});
// test("setReduceR", () => {});
// test("setReduceL", () => {});
