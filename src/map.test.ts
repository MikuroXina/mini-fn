import { expect, test } from "vitest";
import { ControlFlow, Result } from "../mod.js";
import { cat } from "./cat.js";
import {
    fromIterable,
    type ListHkt,
    partialEq as listPartialEq,
    monad,
    toArray,
} from "./list.js";
import * as Map from "./map.js";
import {
    isNone,
    none,
    type Option,
    type OptionHkt,
    monad as optionMonad,
    partialEq as optionPartialEq,
    some,
    unwrap,
} from "./option.js";
import { equal, greater, less } from "./ordering.js";
import { decUtf8, encUtf8, runCode, runDecoder } from "./serial.js";
import { ord, monoid as stringMonoid } from "./string.js";

const assertEqMap = (
    actual: Map<number, string>,
    expected: Map<number, string>,
) => expect(Map.eq<number, string>(ord)(actual, expected)).toStrictEqual(true);

const piMap = Map.fromArray([
    [3, "three"],
    [1, "one"],
    [4, "four"],
]);

const cases = [
    Map.fromArray([]),
    Map.fromArray([
        ["1", "one"],
        ["4", "four"],
        ["2", "two"],
        ["3", "three"],
        ["5", "five"],
        ["2", "two"],
        ["3", "three"],
    ]),
    Map.fromArray([
        ["zero", "0"],
        ["one", "1"],
        ["two", "2"],
    ]),
    Map.fromArray([
        ["one", "1"],
        ["zero", "0"],
        ["two", "2"],
    ]),
    Map.fromArray([
        ["zero", "0"],
        ["two", "2"],
        ["one", "1"],
    ]),
    Map.fromArray([
        ["zero", "0"],
        ["two", "2"],
        ["one", "11"],
    ]),
] as Map<string, string>[];

test("equality", () => {
    const equality = Map.equality<string, string>(ord);

    expect(equality.eq(cases[0]!, cases[1]!)).toStrictEqual(false);
    expect(equality.eq(cases[1]!, cases[0]!)).toStrictEqual(false);
    expect(equality.eq(cases[0]!, cases[2]!)).toStrictEqual(false);
    expect(equality.eq(cases[2]!, cases[0]!)).toStrictEqual(false);
    expect(equality.eq(cases[1]!, cases[2]!)).toStrictEqual(false);
    expect(equality.eq(cases[2]!, cases[1]!)).toStrictEqual(false);

    expect(equality.eq(cases[5]!, cases[0]!)).toStrictEqual(false);
    expect(equality.eq(cases[5]!, cases[1]!)).toStrictEqual(false);
    expect(equality.eq(cases[5]!, cases[2]!)).toStrictEqual(false);

    // symmetric
    for (const x of cases) {
        expect(equality.eq(x, x)).toStrictEqual(true);
    }

    // transitive
    expect(equality.eq(cases[2]!, cases[3]!)).toStrictEqual(true);
    expect(equality.eq(cases[2]!, cases[4]!)).toStrictEqual(true);
    expect(equality.eq(cases[3]!, cases[4]!)).toStrictEqual(true);
});

test("partial order", () => {
    const order = Map.partialCmp({ ordK: ord, ordV: ord });

    expect(order(cases[0]!, cases[0]!)).toStrictEqual(some(equal));
    expect(order(cases[0]!, cases[1]!)).toStrictEqual(some(less));
    expect(order(cases[0]!, cases[2]!)).toStrictEqual(some(less));
    expect(order(cases[0]!, cases[3]!)).toStrictEqual(some(less));
    expect(order(cases[0]!, cases[4]!)).toStrictEqual(some(less));

    expect(order(cases[1]!, cases[0]!)).toStrictEqual(some(greater));
    expect(order(cases[1]!, cases[1]!)).toStrictEqual(some(equal));
    expect(order(cases[1]!, cases[2]!)).toStrictEqual(some(less));
    expect(order(cases[1]!, cases[3]!)).toStrictEqual(some(less));
    expect(order(cases[1]!, cases[4]!)).toStrictEqual(some(less));

    expect(order(cases[2]!, cases[0]!)).toStrictEqual(some(greater));
    expect(order(cases[2]!, cases[1]!)).toStrictEqual(some(greater));
    expect(order(cases[2]!, cases[2]!)).toStrictEqual(some(equal));
    expect(order(cases[2]!, cases[3]!)).toStrictEqual(some(equal));
    expect(order(cases[2]!, cases[4]!)).toStrictEqual(some(equal));

    expect(order(cases[3]!, cases[0]!)).toStrictEqual(some(greater));
    expect(order(cases[3]!, cases[1]!)).toStrictEqual(some(greater));
    expect(order(cases[3]!, cases[2]!)).toStrictEqual(some(equal));
    expect(order(cases[3]!, cases[3]!)).toStrictEqual(some(equal));
    expect(order(cases[3]!, cases[4]!)).toStrictEqual(some(equal));

    expect(order(cases[4]!, cases[0]!)).toStrictEqual(some(greater));
    expect(order(cases[4]!, cases[1]!)).toStrictEqual(some(greater));
    expect(order(cases[4]!, cases[2]!)).toStrictEqual(some(equal));
    expect(order(cases[4]!, cases[3]!)).toStrictEqual(some(equal));
    expect(order(cases[4]!, cases[4]!)).toStrictEqual(some(equal));
});

test("total order", () => {
    const order = Map.cmp({ ordK: ord, ordV: ord });

    expect(order(cases[0]!, cases[0]!)).toStrictEqual(equal);
    expect(order(cases[0]!, cases[1]!)).toStrictEqual(less);
    expect(order(cases[0]!, cases[2]!)).toStrictEqual(less);
    expect(order(cases[0]!, cases[3]!)).toStrictEqual(less);
    expect(order(cases[0]!, cases[4]!)).toStrictEqual(less);

    expect(order(cases[1]!, cases[0]!)).toStrictEqual(greater);
    expect(order(cases[1]!, cases[1]!)).toStrictEqual(equal);
    expect(order(cases[1]!, cases[2]!)).toStrictEqual(less);
    expect(order(cases[1]!, cases[3]!)).toStrictEqual(less);
    expect(order(cases[1]!, cases[4]!)).toStrictEqual(less);

    expect(order(cases[2]!, cases[0]!)).toStrictEqual(greater);
    expect(order(cases[2]!, cases[1]!)).toStrictEqual(greater);
    expect(order(cases[2]!, cases[2]!)).toStrictEqual(equal);
    expect(order(cases[2]!, cases[3]!)).toStrictEqual(equal);
    expect(order(cases[2]!, cases[4]!)).toStrictEqual(equal);

    expect(order(cases[3]!, cases[0]!)).toStrictEqual(greater);
    expect(order(cases[3]!, cases[1]!)).toStrictEqual(greater);
    expect(order(cases[3]!, cases[2]!)).toStrictEqual(equal);
    expect(order(cases[3]!, cases[3]!)).toStrictEqual(equal);
    expect(order(cases[3]!, cases[4]!)).toStrictEqual(equal);

    expect(order(cases[4]!, cases[0]!)).toStrictEqual(greater);
    expect(order(cases[4]!, cases[1]!)).toStrictEqual(greater);
    expect(order(cases[4]!, cases[2]!)).toStrictEqual(equal);
    expect(order(cases[4]!, cases[3]!)).toStrictEqual(equal);
    expect(order(cases[4]!, cases[4]!)).toStrictEqual(equal);
});

test("partial equality unary", () => {
    const equality = Map.partialEqUnary<string>().liftEq(
        (l: string, r: string) => l === r,
    );

    for (const x of cases) {
        expect(equality(x, x)).toStrictEqual(true);
    }

    expect(equality(cases[0]!, cases[1]!)).toStrictEqual(false);
    expect(equality(cases[1]!, cases[0]!)).toStrictEqual(false);
    expect(equality(cases[0]!, cases[2]!)).toStrictEqual(false);
    expect(equality(cases[2]!, cases[0]!)).toStrictEqual(false);
    expect(equality(cases[1]!, cases[2]!)).toStrictEqual(false);
    expect(equality(cases[2]!, cases[1]!)).toStrictEqual(false);
});

test("isEmpty", () => {
    expect(Map.isEmpty(Map.empty())).toStrictEqual(true);
    expect(Map.isEmpty(Map.singleton(1)("one"))).toStrictEqual(false);
});

test("size", () => {
    expect(Map.size(Map.empty())).toStrictEqual(0);
    expect(Map.size(Map.singleton(1)("one"))).toStrictEqual(1);
    expect(Map.size(piMap)).toStrictEqual(3);
});

test("has", () => {
    expect(Map.has(3)(piMap)).toStrictEqual(true);
    expect(Map.has(1)(piMap)).toStrictEqual(true);
    expect(Map.has(4)(piMap)).toStrictEqual(true);
    expect(Map.has(0)(piMap)).toStrictEqual(false);
});

test("get", () => {
    expect(Map.get(3)(piMap)).toStrictEqual(some("three"));
    expect(Map.get(1)(piMap)).toStrictEqual(some("one"));
    expect(Map.get(4)(piMap)).toStrictEqual(some("four"));
    expect(Map.get(0)(piMap)).toStrictEqual(none());
});

test("fromList", () => {
    {
        const m = Map.fromList(fromIterable([]));
        expect(m.size).toStrictEqual(0);
    }

    {
        const m = Map.fromList(
            fromIterable([
                [4, "four"],
                [8, "eight"],
            ]),
        );
        expect(m.size).toStrictEqual(2);
        expect(m.get(4)).toStrictEqual("four");
        expect(m.get(8)).toStrictEqual("eight");
    }
});

test("fromListWith", () => {
    const m = Map.fromListWith(
        (newValue: number) => (oldValue) => newValue + oldValue * 2,
    )(
        fromIterable([
            ["bits1", 2],
            ["bits1", 7],
            ["bits2", 3],
            ["bits2", 0],
            ["bits3", 1],
        ]),
    );

    expect(m.get("bits1")).toStrictEqual(11);
    expect(m.get("bits2")).toStrictEqual(6);
    expect(m.get("bits3")).toStrictEqual(1);
});

test("fromListWithKey", () => {
    const m = Map.fromListWithKey(
        (key: string) => (newValue: number) => (oldValue) =>
            key.startsWith("bits") ? newValue | oldValue : newValue,
    )(
        fromIterable([
            ["bits1", 2],
            ["bits1", 7],
            ["bit", 3],
            ["bit", 1],
        ]),
    );

    expect(m.get("bits1")).toStrictEqual(7);
    expect(m.get("bit")).toStrictEqual(1);
});

test("fromArrayWith", () => {
    const m = Map.fromArrayWith(
        (newValue: string) => (oldValue) => newValue + oldValue,
    )([
        [0, ""],
        [1, " "],
        [1, "one"],
    ]);

    expect(m.get(0)).toStrictEqual("");
    expect(m.get(1)).toStrictEqual("one ");
});

test("fromArrayWithKey", () => {
    const m = Map.fromArrayWithKey(
        (key: number) => (newValue: number) => (oldValue) =>
            key < 0 ? Math.max(newValue, oldValue) : newValue,
    )([
        [4, 1],
        [4, -1],
        [4, 2],
        [3, 0],
        [3, 8],
        [3, 1],
        [-4, 1],
        [-4, -1],
        [-4, 2],
        [-3, 0],
        [-3, 8],
        [-3, 1],
    ]);

    expect(m.get(4)).toStrictEqual(2);
    expect(m.get(3)).toStrictEqual(1);
    expect(m.get(-4)).toStrictEqual(2);
    expect(m.get(-3)).toStrictEqual(8);
});

test("insert", () => {
    assertEqMap(Map.insert(1)("one")(piMap), piMap);
    assertEqMap(Map.insert(1)("one")(Map.empty()), Map.singleton(1)("one"));
});

test("insertWith", () => {
    const inserter = Map.insertWith(
        (newValue: number) => (oldValue) => newValue + oldValue,
    );
    const m = cat(Map.empty<string, number>())
        .feed(inserter("a")(1))
        .feed(inserter("b")(1))
        .feed(inserter("a")(1))
        .feed(inserter("a")(1))
        .feed(inserter("b")(2))
        .feed(inserter("b")(2))
        .feed(inserter("c")(1)).value;

    expect(m.get("a")).toStrictEqual(3);
    expect(m.get("b")).toStrictEqual(5);
    expect(m.get("c")).toStrictEqual(1);
});

test("insertWithKey", () => {
    const inserter = Map.insertWithKey(
        (key: string) => (newValue: number) => (oldValue) =>
            key.startsWith("_") ? newValue : newValue + oldValue,
    );
    const m = cat(Map.empty<string, number>())
        .feed(inserter("a")(1))
        .feed(inserter("b")(1))
        .feed(inserter("_c")(-1))
        .feed(inserter("a")(1))
        .feed(inserter("a")(1))
        .feed(inserter("b")(2))
        .feed(inserter("b")(2))
        .feed(inserter("_c")(1)).value;

    expect(m.get("a")).toStrictEqual(3);
    expect(m.get("b")).toStrictEqual(5);
    expect(m.get("_c")).toStrictEqual(1);
});

test("remove", () => {
    const expected = Map.fromArray([
        [3, "three"],
        [4, "four"],
    ]);
    assertEqMap(Map.remove(1)(piMap), expected);

    assertEqMap(Map.remove(1)(Map.empty()), Map.empty());
});

test("adjust", () => {
    const adjuster = Map.adjust<string>((s) => `new ${s}`);
    assertEqMap(
        adjuster(3)(piMap),
        Map.fromArray([
            [3, "new three"],
            [1, "one"],
            [4, "four"],
        ]),
    );
    assertEqMap(adjuster(0)(piMap), piMap);
    assertEqMap(adjuster(0)(Map.empty()), Map.empty());
});

test("adjustWithKey", () => {
    const adjuster = Map.adjustWithKey<number, string>(
        (key) => (s) => `${key}:new ${s}`,
    );
    assertEqMap(
        adjuster(3)(piMap),
        Map.fromArray([
            [3, "3:new three"],
            [1, "one"],
            [4, "four"],
        ]),
    );
    assertEqMap(adjuster(0)(piMap), piMap);
    assertEqMap(adjuster(0)(Map.empty()), Map.empty());
});

test("update", () => {
    const updater = Map.update((x: string) =>
        x === "three" ? some("new three") : none(),
    );

    assertEqMap(
        updater(3)(piMap),
        Map.fromArray([
            [3, "new three"],
            [1, "one"],
            [4, "four"],
        ]),
    );
    assertEqMap(updater(0)(piMap), piMap);
    assertEqMap(
        updater(1)(piMap),
        Map.fromArray([
            [3, "three"],
            [4, "four"],
        ]),
    );
});

test("updateWithKey", () => {
    const updater = Map.updateWithKey<number, string>(
        (key) => (s) => (s === "three" ? some(`${key}:new three`) : none()),
    );

    assertEqMap(
        updater(3)(piMap),
        Map.fromArray([
            [3, "3:new three"],
            [1, "one"],
            [4, "four"],
        ]),
    );
    assertEqMap(
        updater(1)(piMap),
        Map.fromArray([
            [3, "three"],
            [4, "four"],
        ]),
    );
    assertEqMap(updater(0)(piMap), piMap);
});

test("alter", () => {
    const alterer1 = Map.alter<string>(() => none());
    assertEqMap(alterer1(0)(piMap), piMap);
    assertEqMap(
        alterer1(1)(piMap),
        Map.fromArray([
            [3, "three"],
            [4, "four"],
        ]),
    );

    const alterer2 = Map.alter<string>(() => some("foo"));
    assertEqMap(
        alterer2(0)(piMap),
        Map.fromArray([
            [3, "three"],
            [4, "four"],
            [1, "one"],
            [0, "foo"],
        ]),
    );
    assertEqMap(
        alterer2(1)(piMap),
        Map.fromArray([
            [3, "three"],
            [1, "foo"],
            [4, "four"],
        ]),
    );
});

test("alterF", () => {
    const modifier = Map.alterF(ControlFlow.functor<never[]>())(
        (oldEntry: Option<string>) => {
            if (isNone(oldEntry)) {
                return ControlFlow.newContinue(some("Untitled"));
            }
            const item = unwrap(oldEntry);
            if (item === "STOP") {
                return ControlFlow.newBreak([]);
            }
            return ControlFlow.newContinue(some(`${item} (1)`));
        },
    );

    expect(
        modifier("foo")(
            Map.fromArray([
                ["foo", "Data"],
                ["bar", "Value"],
            ]),
        ),
    ).toStrictEqual(
        ControlFlow.newContinue(
            Map.fromArray([
                ["foo", "Data (1)"],
                ["bar", "Value"],
            ]),
        ),
    );
    expect(modifier("foo")(Map.fromArray([["bar", "Value"]]))).toStrictEqual(
        ControlFlow.newContinue(
            Map.fromArray([
                ["foo", "Untitled"],
                ["bar", "Value"],
            ]),
        ),
    );
    expect(
        modifier("foo")(
            Map.fromArray([
                ["foo", "STOP"],
                ["bar", "Value"],
            ]),
        ),
    ).toStrictEqual(ControlFlow.newBreak([]));
});

test("union", () => {
    const actual = Map.union(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "two"],
            [5, "five"],
            [3, "THREE"],
        ]),
    );
});

test("unionWith", () => {
    const actual = Map.unionWith<string>((l) => (r) => l + r)(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "twoTWO"],
            [5, "five"],
            [3, "THREE"],
        ]),
    );
});

test("unionWithKey", () => {
    const actual = Map.unionWithKey<number, string>(
        (k) => (l) => (r) => `${k}:${l}|${r}`,
    )(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "2:two|TWO"],
            [5, "five"],
            [3, "THREE"],
        ]),
    );
});

test("unionMonoid", () => {
    const m = Map.unionMonoid<string, string>();
    const a = Map.fromArray([["one", "1"]]);
    const b = Map.fromArray([
        ["four", "4"],
        ["three", "3"],
    ]);
    const c = Map.fromArray([
        ["one", "uno"],
        ["two", "duo"],
    ]);
    // associative
    expect(m.combine(a, m.combine(b, c))).toStrictEqual(
        m.combine(m.combine(a, b), c),
    );

    // identity
    for (const map of [a, b, c]) {
        expect(m.combine(map, m.identity)).toStrictEqual(map);
        expect(m.combine(m.identity, map)).toStrictEqual(map);
    }
});

test("difference", () => {
    const actual = Map.difference(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[5, "five"]]));
});

test("differenceWith", () => {
    const actual = Map.differenceWith<string>(
        (l) => (r) => (l === "five" ? some(`${l}:${r}`) : none()),
    )(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
            [5, "FIVE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[5, "five:FIVE"]]));
});

test("differenceWithKey", () => {
    const actual = Map.differenceWithKey<number, string>(
        (key) => (l) => (r) =>
            l === "five" ? some(`${key}:${l}|${r}`) : none(),
    )(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
            [5, "FIVE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[5, "5:five|FIVE"]]));
});

test("intersection", () => {
    const actual = Map.intersection(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[2, "two"]]));
});

test("intersectionWith", () => {
    const actual = Map.intersectionWith<string>((l) => (r) => l + r)(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[2, "twoTWO"]]));
});

test("intersectionWithKey", () => {
    const actual = Map.intersectionWithKey<number, string>(
        (k) => (l) => (r) => `${k}:${l}|${r}`,
    )(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(
        Map.fromArray([
            [2, "TWO"],
            [3, "THREE"],
        ]),
    );
    assertEqMap(actual, Map.fromArray([[2, "2:two|TWO"]]));
});

test("isDisjoint", () => {
    expect(Map.isDisjoint(piMap)(Map.fromArray([[2, 1]]))).toStrictEqual(true);
    expect(Map.isDisjoint(piMap)(Map.fromArray([[1, 2]]))).toStrictEqual(false);
    expect(Map.isDisjoint(Map.empty())(Map.fromArray([[0, 0]]))).toStrictEqual(
        true,
    );
    expect(Map.isDisjoint(piMap)(Map.empty())).toStrictEqual(true);
    expect(Map.isDisjoint(Map.empty())(Map.empty())).toStrictEqual(true);
});

test("compose", () => {
    const actual = Map.compose(
        Map.fromArray([
            ["two", "TWO"],
            ["three", "THREE"],
            ["four", "FOUR"],
        ]),
    )(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "THREE"],
            [4, "FOUR"],
        ]),
    );
});

test("map", () => {
    const actual = Map.map((s: string) => s.toUpperCase())(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "THREE"],
            [1, "ONE"],
            [4, "FOUR"],
        ]),
    );
});

test("mapWithKey", () => {
    const actual = Map.mapWithKey(
        (k: number) => (s: string) => `${k}:${s.toUpperCase()}`,
    )(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "3:THREE"],
            [1, "1:ONE"],
            [4, "4:FOUR"],
        ]),
    );
});

test("traverse", () => {
    const actual = Map.traverse<ListHkt>(monad)((value: string) =>
        fromIterable(value),
    )(
        Map.fromArray([
            [2, "34"],
            [5, "67"],
        ]),
    );
    const expected = fromIterable([
        Map.fromArray([
            [2, "3"],
            [5, "6"],
        ]),
        Map.fromArray([
            [2, "4"],
            [5, "6"],
        ]),
        Map.fromArray([
            [2, "3"],
            [5, "7"],
        ]),
        Map.fromArray([
            [2, "4"],
            [5, "7"],
        ]),
    ]);
    expect(
        listPartialEq(Map.equality<number, string>(ord)).eq(actual, expected),
    ).toStrictEqual(true);
});

test("traverseWithKey", () => {
    const actual = Map.traverseWithKey<OptionHkt>(optionMonad)(
        (k: number) => (value: string) => (k % 2 === 0 ? some(value) : none()),
    )(
        Map.fromArray([
            [2, "34"],
            [6, "78"],
        ]),
    );
    const expected: Option<Map<number, string>> = some(
        Map.fromArray([
            [2, "34"],
            [6, "78"],
        ]),
    );
    expect(
        optionPartialEq(Map.equality<number, string>(ord)).eq(actual, expected),
    ).toStrictEqual(true);
});

test("traverseSomeWIthKey", () => {
    const actual = Map.traverseSomeWithKey<ListHkt>(monad)(
        (k: number) => (value: string) =>
            k % 2 === 0 ? monad.pure(some(value)) : monad.pure(none()),
    )(
        Map.fromArray([
            [2, "34"],
            [5, "67"],
        ]),
    );
    const expected = fromIterable([Map.fromArray([[2, "34"]])]);
    expect(
        listPartialEq(Map.equality<number, string>(ord)).eq(actual, expected),
    ).toStrictEqual(true);
});

test("scan", () => {
    const actual = Map.scan((acc: string) => (item: string) => [
        `${acc} ${item}`,
        item + "X",
    ])("Everything:")(piMap);
    expect(actual).toStrictEqual([
        "Everything: three one four",
        Map.fromArray([
            [3, "threeX"],
            [1, "oneX"],
            [4, "fourX"],
        ]),
    ]);
});

test("scanWithKey", () => {
    const actual = Map.scanWithKey(
        (acc: string) => (key: number) => (item: string) => [
            `${acc} ${key}-${item}`,
            item + "X",
        ],
    )("Everything:")(piMap);
    expect(actual).toStrictEqual([
        "Everything: 3-three 1-one 4-four",
        Map.fromArray([
            [3, "threeX"],
            [1, "oneX"],
            [4, "fourX"],
        ]),
    ]);
});

test("mapKeys", () => {
    assertEqMap(
        Map.mapKeys((key: number) => key + 1)(piMap),
        Map.fromArray([
            [4, "three"],
            [2, "one"],
            [5, "four"],
        ]),
    );
});

test("mapKeysWith", () => {
    assertEqMap(
        Map.mapKeysWith(
            (newValue: string) => (oldValue) => `${oldValue} ${newValue}`,
        )(() => 1)(piMap),
        Map.singleton(1)("three one four"),
    );
});

test("foldR", () => {
    const folder = Map.foldR((item: string) => (acc: string) => item + acc)("");
    expect(folder(cases[2]!)).toStrictEqual("012");
});

test("foldRWithKey", () => {
    const folder = Map.foldRWithKey(
        (key: string) => (item: string) => (acc: string) =>
            key.length < 4 ? item + acc : acc,
    )("");
    expect(folder(cases[2]!)).toStrictEqual("12");
});

test("foldL", () => {
    const folder = Map.foldL((acc: string) => (item: string) => item + acc)("");
    expect(folder(cases[2]!)).toStrictEqual("210");
});

test("foldLWithKey", () => {
    const folder = Map.foldLWithKey(
        (key: string) => (acc: string) => (item: string) =>
            key.length < 4 ? item + acc : acc,
    )("");
    expect(folder(cases[2]!)).toStrictEqual("21");
});

test("foldMapWithKey", () => {
    const folder = Map.foldMapWithKey(stringMonoid)(
        (key: number) => (value: string) => `${key}:${value}`,
    );

    expect(folder(Map.fromArray([]))).toStrictEqual("");
    expect(folder(piMap)).toStrictEqual("3:three1:one4:four");
});

test("keys", () => {
    expect(toArray(Map.keys(piMap))).toStrictEqual([3, 1, 4]);
});
test("values", () => {
    expect(toArray(Map.values(piMap))).toStrictEqual(["three", "one", "four"]);
});
test("entries", () => {
    expect(toArray(Map.entries(piMap))).toStrictEqual([
        [3, "three"],
        [1, "one"],
        [4, "four"],
    ]);
});

test("sortedEntries", () => {
    expect(
        toArray(Map.sortedEntries({ ordK: ord, ordV: ord })(cases[0]!)),
    ).toStrictEqual([]);
    expect(
        toArray(Map.sortedEntries({ ordK: ord, ordV: ord })(cases[1]!)),
    ).toStrictEqual([
        ["1", "one"],
        ["2", "two"],
        ["3", "three"],
        ["4", "four"],
        ["5", "five"],
    ]);
});

test("filter", () => {
    const actual = Map.filter((x: string) => x > "o")(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "three"],
            [1, "one"],
        ]),
    );
});

test("filterWithKey", () => {
    const actual = Map.filterWithKey(
        (key: number) => (value: string) => key > 2 && value > "o",
    )(piMap);
    assertEqMap(actual, Map.fromArray([[3, "three"]]));
});

test("partition", () => {
    const actual = Map.partition((x: string) => x > "o")(piMap);
    expect(actual).toStrictEqual([
        Map.fromArray([
            [1, "one"],
            [3, "three"],
        ]),
        Map.fromArray([[4, "four"]]),
    ]);
});

test("partitionWithKey", () => {
    const actual = Map.partitionWithKey(
        (key: number) => (value: string) => key > 2 && value > "o",
    )(piMap);
    expect(actual).toStrictEqual([
        Map.fromArray([[3, "three"]]),
        Map.fromArray([
            [1, "one"],
            [4, "four"],
        ]),
    ]);
});

test("mapOption", () => {
    const actual = Map.mapOption((value: string) =>
        value === "three" ? some("new three") : none(),
    )(piMap);
    assertEqMap(actual, Map.singleton(3)("new three"));
});

test("mapOptionWithKey", () => {
    const actual = Map.mapOptionWithKey(
        (key: number) => (value: string) =>
            value === "three" ? some(`${key}:new three`) : none(),
    )(piMap);
    assertEqMap(actual, Map.singleton(3)("3:new three"));
});

test("mapResult", () => {
    const mapper = Map.mapResult((value: string) =>
        value.length < 4 ? Result.ok(value) : Result.err(value),
    );

    expect(mapper(cases[0]!)).toStrictEqual([
        Map.fromArray([]),
        Map.fromArray([]),
    ]);
    expect(mapper(cases[1]!)).toStrictEqual([
        Map.fromArray([
            ["4", "four"],
            ["3", "three"],
            ["5", "five"],
        ]),
        Map.fromArray([
            ["1", "one"],
            ["2", "two"],
        ]),
    ]);
});

test("mapResultWithKey", () => {
    const mapper = Map.mapResultWithKey(
        (key: string) => (value: string) =>
            key === "1" ? Result.ok(value) : Result.err(value),
    );

    expect(mapper(cases[0]!)).toStrictEqual([
        Map.fromArray([]),
        Map.fromArray([]),
    ]);
    expect(mapper(cases[1]!)).toStrictEqual([
        Map.fromArray([
            ["4", "four"],
            ["2", "two"],
            ["3", "three"],
            ["5", "five"],
        ]),
        Map.fromArray([["1", "one"]]),
    ]);
});

test("isSubsetOfBy", () => {
    const isSubsetOfByEq = Map.isSubsetOf(ord);
    const isSubsetOfByLe = Map.isSubsetOfBy(
        (sub: string) => (sup: string) => sub <= sup,
    );
    const isSubsetOfByLt = Map.isSubsetOfBy(
        (sub: string) => (sup: string) => sub < sup,
    );

    expect(isSubsetOfByEq(Map.fromArray([[1, "one"]]))(piMap)).toStrictEqual(
        true,
    );
    expect(isSubsetOfByEq(Map.fromArray([[3, "three"]]))(piMap)).toStrictEqual(
        true,
    );
    expect(isSubsetOfByEq(Map.fromArray([[4, "four"]]))(piMap)).toStrictEqual(
        true,
    );
    expect(
        isSubsetOfByEq(
            Map.fromArray([
                [1, "one"],
                [3, "three"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(
            Map.fromArray([
                [3, "three"],
                [4, "four"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(
            Map.fromArray([
                [1, "one"],
                [4, "four"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(isSubsetOfByEq(piMap)(piMap)).toStrictEqual(true);
    expect(isSubsetOfByLe(Map.fromArray([[1, "one"]]))(piMap)).toStrictEqual(
        true,
    );

    expect(isSubsetOfByEq(Map.fromArray([[1, "two"]]))(piMap)).toStrictEqual(
        false,
    );
    expect(isSubsetOfByLt(Map.fromArray([[1, "one"]]))(piMap)).toStrictEqual(
        false,
    );

    expect(isSubsetOfByEq(piMap)(Map.fromArray([[1, "one"]]))).toStrictEqual(
        false,
    );
});

test("isProperSubsetOfBy", () => {
    const isProperSubsetOfByEq = Map.isProperSubsetOf(ord);
    const isProperSubsetOfByLe = Map.isProperSubsetOfBy(
        (sub: string) => (sup: string) => sub <= sup,
    );
    const isProperSubsetOfByLt = Map.isProperSubsetOfBy(
        (sub: string) => (sup: string) => sub < sup,
    );

    expect(
        isProperSubsetOfByEq(Map.fromArray([[1, "one"]]))(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(Map.fromArray([[3, "three"]]))(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(Map.fromArray([[4, "four"]]))(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Map.fromArray([
                [1, "one"],
                [3, "three"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Map.fromArray([
                [3, "three"],
                [4, "four"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Map.fromArray([
                [1, "one"],
                [4, "four"],
            ]),
        )(piMap),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByLe(Map.fromArray([[1, "one"]]))(piMap),
    ).toStrictEqual(true);

    expect(isProperSubsetOfByEq(piMap)(piMap)).toStrictEqual(false);
    expect(
        isProperSubsetOfByEq(Map.fromArray([[1, "two"]]))(piMap),
    ).toStrictEqual(false);
    expect(
        isProperSubsetOfByLt(Map.fromArray([[1, "one"]]))(piMap),
    ).toStrictEqual(false);

    expect(
        isProperSubsetOfByEq(piMap)(Map.fromArray([[1, "one"]])),
    ).toStrictEqual(false);
});

test("countItems", () => {
    const res = Map.countItems(fromIterable([1, 4, 2, 3, 5, 2, 3]));
    expect(res.get(0)).toStrictEqual(undefined);
    expect(res.get(1)).toStrictEqual(1);
    expect(res.get(2)).toStrictEqual(2);
    expect(res.get(3)).toStrictEqual(2);
    expect(res.get(4)).toStrictEqual(1);
    expect(res.get(5)).toStrictEqual(1);
    expect(res.get(6)).toStrictEqual(undefined);
});

test("functor laws", () => {
    const f = Map.functor<string>();
    // identity
    for (const item of cases) {
        expect(f.map((x: string) => x)(item)).toStrictEqual(item);
    }

    // composition
    const bang = (x: string) => x + "!";
    const question = (x: string) => x + "?";
    for (const item of cases) {
        expect(f.map((x: string) => question(bang(x)))(item)).toStrictEqual(
            f.map(question)(f.map(bang)(item)),
        );
    }
});

test("foldable functor laws", () => {
    const f = Map.foldable<string>();

    const folder = f.foldR((item: string) => (acc: string) => item + acc)("");
    expect(folder(cases[2]!)).toStrictEqual("012");
});

test("traversable functor laws", () => {
    const t = Map.traversable<number>();

    const actual = t.traverse<ListHkt>(monad)((value: string) =>
        fromIterable(value),
    )(
        Map.fromArray([
            [2, "34"],
            [5, "67"],
        ]),
    );
    const expected = fromIterable([
        Map.fromArray([
            [2, "3"],
            [5, "6"],
        ]),
        Map.fromArray([
            [2, "4"],
            [5, "6"],
        ]),
        Map.fromArray([
            [2, "3"],
            [5, "7"],
        ]),
        Map.fromArray([
            [2, "4"],
            [5, "7"],
        ]),
    ]);
    expect(
        listPartialEq(Map.equality<number, string>(ord)).eq(actual, expected),
    ).toStrictEqual(true);
});

test("encode then decode", () => {
    const data = cases[1]!;
    const code = runCode(Map.enc(encUtf8)(encUtf8)(data));
    const decoded = Result.unwrap(
        runDecoder(Map.dec(decUtf8())(decUtf8()))(code),
    );
    expect(data).toStrictEqual(decoded);
});
