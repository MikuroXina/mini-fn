import { assertEquals } from "../deps.ts";
import {
    isNone,
    monad as optionMonad,
    none,
    type Option,
    type OptionHkt,
    partialEq as optionPartialEq,
    some,
    unwrap,
} from "./option.ts";
import { monoid as stringMonoid, ord } from "./string.ts";
import * as Map from "./map.ts";
import {
    fromIterable,
    type ListHkt,
    monad,
    partialEq as listPartialEq,
    toArray,
} from "./list.ts";
import { equal, greater, less } from "./ordering.ts";
import { cat } from "./cat.ts";
import { ControlFlow, Result } from "../mod.ts";
import { decUtf8, encUtf8, runCode, runDecoder } from "./serial.ts";

const assertEqMap = (
    actual: Map<number, string>,
    expected: Map<number, string>,
) => assertEquals(Map.eq<number, string>(ord)(actual, expected), true);

const piMap = Map.fromArray([[3, "three"], [1, "one"], [4, "four"]]);

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
    Map.fromArray([["zero", "0"], ["one", "1"], ["two", "2"]]),
    Map.fromArray([["one", "1"], ["zero", "0"], ["two", "2"]]),
    Map.fromArray([["zero", "0"], ["two", "2"], ["one", "1"]]),
    Map.fromArray([["zero", "0"], ["two", "2"], ["one", "11"]]),
] as Map<string, string>[];

Deno.test("equality", () => {
    const equality = Map.equality<string, string>(ord);

    assertEquals(equality.eq(cases[0]!, cases[1]!), false);
    assertEquals(equality.eq(cases[1]!, cases[0]!), false);
    assertEquals(equality.eq(cases[0]!, cases[2]!), false);
    assertEquals(equality.eq(cases[2]!, cases[0]!), false);
    assertEquals(equality.eq(cases[1]!, cases[2]!), false);
    assertEquals(equality.eq(cases[2]!, cases[1]!), false);

    assertEquals(equality.eq(cases[5]!, cases[0]!), false);
    assertEquals(equality.eq(cases[5]!, cases[1]!), false);
    assertEquals(equality.eq(cases[5]!, cases[2]!), false);

    // symmetric
    for (const x of cases) {
        assertEquals(equality.eq(x, x), true);
    }

    // transitive
    assertEquals(equality.eq(cases[2]!, cases[3]!), true);
    assertEquals(equality.eq(cases[2]!, cases[4]!), true);
    assertEquals(equality.eq(cases[3]!, cases[4]!), true);
});

Deno.test("partial order", () => {
    const order = Map.partialCmp({ ordK: ord, ordV: ord });

    assertEquals(order(cases[0]!, cases[0]!), some(equal));
    assertEquals(order(cases[0]!, cases[1]!), some(less));
    assertEquals(order(cases[0]!, cases[2]!), some(less));
    assertEquals(order(cases[0]!, cases[3]!), some(less));
    assertEquals(order(cases[0]!, cases[4]!), some(less));

    assertEquals(order(cases[1]!, cases[0]!), some(greater));
    assertEquals(order(cases[1]!, cases[1]!), some(equal));
    assertEquals(order(cases[1]!, cases[2]!), some(less));
    assertEquals(order(cases[1]!, cases[3]!), some(less));
    assertEquals(order(cases[1]!, cases[4]!), some(less));

    assertEquals(order(cases[2]!, cases[0]!), some(greater));
    assertEquals(order(cases[2]!, cases[1]!), some(greater));
    assertEquals(order(cases[2]!, cases[2]!), some(equal));
    assertEquals(order(cases[2]!, cases[3]!), some(equal));
    assertEquals(order(cases[2]!, cases[4]!), some(equal));

    assertEquals(order(cases[3]!, cases[0]!), some(greater));
    assertEquals(order(cases[3]!, cases[1]!), some(greater));
    assertEquals(order(cases[3]!, cases[2]!), some(equal));
    assertEquals(order(cases[3]!, cases[3]!), some(equal));
    assertEquals(order(cases[3]!, cases[4]!), some(equal));

    assertEquals(order(cases[4]!, cases[0]!), some(greater));
    assertEquals(order(cases[4]!, cases[1]!), some(greater));
    assertEquals(order(cases[4]!, cases[2]!), some(equal));
    assertEquals(order(cases[4]!, cases[3]!), some(equal));
    assertEquals(order(cases[4]!, cases[4]!), some(equal));
});

Deno.test("total order", () => {
    const order = Map.cmp({ ordK: ord, ordV: ord });

    assertEquals(order(cases[0]!, cases[0]!), equal);
    assertEquals(order(cases[0]!, cases[1]!), less);
    assertEquals(order(cases[0]!, cases[2]!), less);
    assertEquals(order(cases[0]!, cases[3]!), less);
    assertEquals(order(cases[0]!, cases[4]!), less);

    assertEquals(order(cases[1]!, cases[0]!), greater);
    assertEquals(order(cases[1]!, cases[1]!), equal);
    assertEquals(order(cases[1]!, cases[2]!), less);
    assertEquals(order(cases[1]!, cases[3]!), less);
    assertEquals(order(cases[1]!, cases[4]!), less);

    assertEquals(order(cases[2]!, cases[0]!), greater);
    assertEquals(order(cases[2]!, cases[1]!), greater);
    assertEquals(order(cases[2]!, cases[2]!), equal);
    assertEquals(order(cases[2]!, cases[3]!), equal);
    assertEquals(order(cases[2]!, cases[4]!), equal);

    assertEquals(order(cases[3]!, cases[0]!), greater);
    assertEquals(order(cases[3]!, cases[1]!), greater);
    assertEquals(order(cases[3]!, cases[2]!), equal);
    assertEquals(order(cases[3]!, cases[3]!), equal);
    assertEquals(order(cases[3]!, cases[4]!), equal);

    assertEquals(order(cases[4]!, cases[0]!), greater);
    assertEquals(order(cases[4]!, cases[1]!), greater);
    assertEquals(order(cases[4]!, cases[2]!), equal);
    assertEquals(order(cases[4]!, cases[3]!), equal);
    assertEquals(order(cases[4]!, cases[4]!), equal);
});

Deno.test("partial equality unary", () => {
    const equality = Map.partialEqUnary<string>().liftEq((
        l: string,
        r: string,
    ) => l === r);

    for (const x of cases) {
        assertEquals(equality(x, x), true);
    }

    assertEquals(equality(cases[0]!, cases[1]!), false);
    assertEquals(equality(cases[1]!, cases[0]!), false);
    assertEquals(equality(cases[0]!, cases[2]!), false);
    assertEquals(equality(cases[2]!, cases[0]!), false);
    assertEquals(equality(cases[1]!, cases[2]!), false);
    assertEquals(equality(cases[2]!, cases[1]!), false);
});

Deno.test("isEmpty", () => {
    assertEquals(Map.isEmpty(Map.empty()), true);
    assertEquals(Map.isEmpty(Map.singleton(1)("one")), false);
});

Deno.test("size", () => {
    assertEquals(Map.size(Map.empty()), 0);
    assertEquals(Map.size(Map.singleton(1)("one")), 1);
    assertEquals(Map.size(piMap), 3);
});

Deno.test("has", () => {
    assertEquals(Map.has(3)(piMap), true);
    assertEquals(Map.has(1)(piMap), true);
    assertEquals(Map.has(4)(piMap), true);
    assertEquals(Map.has(0)(piMap), false);
});

Deno.test("get", () => {
    assertEquals(Map.get(3)(piMap), some("three"));
    assertEquals(Map.get(1)(piMap), some("one"));
    assertEquals(Map.get(4)(piMap), some("four"));
    assertEquals(Map.get(0)(piMap), none());
});

Deno.test("fromList", () => {
    {
        const m = Map.fromList(fromIterable([]));
        assertEquals(m.size, 0);
    }

    {
        const m = Map.fromList(fromIterable([[4, "four"], [8, "eight"]]));
        assertEquals(m.size, 2);
        assertEquals(m.get(4), "four");
        assertEquals(m.get(8), "eight");
    }
});

Deno.test("fromListWith", () => {
    const m = Map.fromListWith((newValue: number) => (oldValue) =>
        newValue + oldValue * 2
    )(fromIterable([
        ["bits1", 2],
        ["bits1", 7],
        ["bits2", 3],
        ["bits2", 0],
        ["bits3", 1],
    ]));

    assertEquals(m.get("bits1"), 11);
    assertEquals(m.get("bits2"), 6);
    assertEquals(m.get("bits3"), 1);
});

Deno.test("fromListWithKey", () => {
    const m = Map.fromListWithKey(
        (key: string) => (newValue: number) => (oldValue) =>
            key.startsWith("bits") ? (newValue | oldValue) : newValue,
    )(fromIterable([
        ["bits1", 2],
        ["bits1", 7],
        ["bit", 3],
        ["bit", 1],
    ]));

    assertEquals(m.get("bits1"), 7);
    assertEquals(m.get("bit"), 1);
});

Deno.test("fromArrayWith", () => {
    const m = Map.fromArrayWith((newValue: string) => (oldValue) =>
        newValue + oldValue
    )([
        [0, ""],
        [1, " "],
        [1, "one"],
    ]);

    assertEquals(m.get(0), "");
    assertEquals(m.get(1), "one ");
});

Deno.test("fromArrayWithKey", () => {
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

    assertEquals(m.get(4), 2);
    assertEquals(m.get(3), 1);
    assertEquals(m.get(-4), 2);
    assertEquals(m.get(-3), 8);
});

Deno.test("insert", () => {
    assertEqMap(Map.insert(1)("one")(piMap), piMap);
    assertEqMap(Map.insert(1)("one")(Map.empty()), Map.singleton(1)("one"));
});

Deno.test("insertWith", () => {
    const inserter = Map.insertWith((newValue: number) => (oldValue) =>
        newValue + oldValue
    );
    const m = cat(Map.empty<string, number>())
        .feed(inserter("a")(1))
        .feed(inserter("b")(1))
        .feed(inserter("a")(1))
        .feed(inserter("a")(1))
        .feed(inserter("b")(2))
        .feed(inserter("b")(2))
        .feed(inserter("c")(1))
        .value;

    assertEquals(m.get("a"), 3);
    assertEquals(m.get("b"), 5);
    assertEquals(m.get("c"), 1);
});

Deno.test("insertWithKey", () => {
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

    assertEquals(m.get("a"), 3);
    assertEquals(m.get("b"), 5);
    assertEquals(m.get("_c"), 1);
});

Deno.test("remove", () => {
    const expected = Map.fromArray([[3, "three"], [4, "four"]]);
    assertEqMap(Map.remove(1)(piMap), expected);

    assertEqMap(Map.remove(1)(Map.empty()), Map.empty());
});

Deno.test("adjust", () => {
    const adjuster = Map.adjust<string>((s) => `new ${s}`);
    assertEqMap(
        adjuster(3)(piMap),
        Map.fromArray([[3, "new three"], [1, "one"], [4, "four"]]),
    );
    assertEqMap(adjuster(0)(piMap), piMap);
    assertEqMap(adjuster(0)(Map.empty()), Map.empty());
});

Deno.test("adjustWithKey", () => {
    const adjuster = Map.adjustWithKey<number, string>((key) => (s) =>
        `${key}:new ${s}`
    );
    assertEqMap(
        adjuster(3)(piMap),
        Map.fromArray([[3, "3:new three"], [1, "one"], [4, "four"]]),
    );
    assertEqMap(adjuster(0)(piMap), piMap);
    assertEqMap(adjuster(0)(Map.empty()), Map.empty());
});

Deno.test("update", () => {
    const updater = Map.update((x: string) =>
        x === "three" ? some("new three") : none()
    );

    assertEqMap(
        updater(3)(piMap),
        Map.fromArray([[3, "new three"], [1, "one"], [4, "four"]]),
    );
    assertEqMap(updater(0)(piMap), piMap);
    assertEqMap(updater(1)(piMap), Map.fromArray([[3, "three"], [4, "four"]]));
});

Deno.test("updateWithKey", () => {
    const updater = Map.updateWithKey<number, string>((key) => (s) =>
        s === "three" ? some(`${key}:new three`) : none()
    );

    assertEqMap(
        updater(3)(piMap),
        Map.fromArray([[3, "3:new three"], [1, "one"], [4, "four"]]),
    );
    assertEqMap(updater(1)(piMap), Map.fromArray([[3, "three"], [4, "four"]]));
    assertEqMap(updater(0)(piMap), piMap);
});

Deno.test("alter", () => {
    const alterer1 = Map.alter<string>(() => none());
    assertEqMap(alterer1(0)(piMap), piMap);
    assertEqMap(alterer1(1)(piMap), Map.fromArray([[3, "three"], [4, "four"]]));

    const alterer2 = Map.alter<string>(() => some("foo"));
    assertEqMap(
        alterer2(0)(piMap),
        Map.fromArray([[3, "three"], [4, "four"], [1, "one"], [0, "foo"]]),
    );
    assertEqMap(
        alterer2(1)(piMap),
        Map.fromArray([[3, "three"], [1, "foo"], [4, "four"]]),
    );
});

Deno.test("alterF", () => {
    const modifier = Map.alterF(ControlFlow.functor<never[]>())(
        (oldEntry: Option<string>) => {
            if (isNone(oldEntry)) {
                return ControlFlow.newContinue(some(
                    "Untitled",
                ));
            }
            const item = unwrap(oldEntry);
            if (item === "STOP") {
                return ControlFlow.newBreak([]);
            }
            return ControlFlow.newContinue(some(`${item} (1)`));
        },
    );

    assertEquals(
        modifier("foo")(Map.fromArray([
            ["foo", "Data"],
            ["bar", "Value"],
        ])),
        ControlFlow.newContinue(
            Map.fromArray([["foo", "Data (1)"], ["bar", "Value"]]),
        ),
    );
    assertEquals(
        modifier("foo")(Map.fromArray([
            ["bar", "Value"],
        ])),
        ControlFlow.newContinue(
            Map.fromArray([["foo", "Untitled"], ["bar", "Value"]]),
        ),
    );
    assertEquals(
        modifier("foo")(Map.fromArray([
            ["foo", "STOP"],
            ["bar", "Value"],
        ])),
        ControlFlow.newBreak([]),
    );
});

Deno.test("union", () => {
    const actual = Map.union(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(actual, Map.fromArray([[2, "two"], [5, "five"], [3, "THREE"]]));
});

Deno.test("unionWith", () => {
    const actual = Map.unionWith<string>((l) => (r) => l + r)(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([[2, "twoTWO"], [5, "five"], [3, "THREE"]]),
    );
});

Deno.test("unionWithKey", () => {
    const actual = Map.unionWithKey<number, string>((k) => (l) => (r) =>
        `${k}:${l}|${r}`
    )(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([[2, "2:two|TWO"], [5, "five"], [3, "THREE"]]),
    );
});

Deno.test("unionMonoid", () => {
    const m = Map.unionMonoid<string, string>();
    const a = Map.fromArray([
        ["one", "1"],
    ]);
    const b = Map.fromArray([
        ["four", "4"],
        ["three", "3"],
    ]);
    const c = Map.fromArray([
        ["one", "uno"],
        ["two", "duo"],
    ]);
    // associative
    assertEquals(m.combine(a, m.combine(b, c)), m.combine(m.combine(a, b), c));

    // identity
    for (const map of [a, b, c]) {
        assertEquals(m.combine(map, m.identity), map);
        assertEquals(m.combine(m.identity, map), map);
    }
});

Deno.test("difference", () => {
    const actual = Map.difference(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [5, "five"],
        ]),
    );
});

Deno.test("differenceWith", () => {
    const actual = Map.differenceWith<string>((l) => (r) =>
        l === "five" ? some(`${l}:${r}`) : none()
    )(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
        [5, "FIVE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [5, "five:FIVE"],
        ]),
    );
});

Deno.test("differenceWithKey", () => {
    const actual = Map.differenceWithKey<number, string>((key) => (l) => (r) =>
        l === "five" ? some(`${key}:${l}|${r}`) : none()
    )(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
        [5, "FIVE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [5, "5:five|FIVE"],
        ]),
    );
});

Deno.test("intersection", () => {
    const actual = Map.intersection(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "two"],
        ]),
    );
});

Deno.test("intersectionWith", () => {
    const actual = Map.intersectionWith<string>((l) => (r) => l + r)(
        Map.fromArray([
            [2, "two"],
            [5, "five"],
        ]),
    )(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "twoTWO"],
        ]),
    );
});

Deno.test("intersectionWithKey", () => {
    const actual = Map.intersectionWithKey<number, string>((k) => (l) => (r) =>
        `${k}:${l}|${r}`
    )(Map.fromArray([
        [2, "two"],
        [5, "five"],
    ]))(Map.fromArray([
        [2, "TWO"],
        [3, "THREE"],
    ]));
    assertEqMap(
        actual,
        Map.fromArray([
            [2, "2:two|TWO"],
        ]),
    );
});

Deno.test("isDisjoint", () => {
    assertEquals(Map.isDisjoint(piMap)(Map.fromArray([[2, 1]])), true);
    assertEquals(Map.isDisjoint(piMap)(Map.fromArray([[1, 2]])), false);
    assertEquals(Map.isDisjoint(Map.empty())(Map.fromArray([[0, 0]])), true);
    assertEquals(Map.isDisjoint(piMap)(Map.empty()), true);
    assertEquals(Map.isDisjoint(Map.empty())(Map.empty()), true);
});

Deno.test("compose", () => {
    const actual = Map.compose(Map.fromArray([
        ["two", "TWO"],
        ["three", "THREE"],
        ["four", "FOUR"],
    ]))(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "THREE"],
            [4, "FOUR"],
        ]),
    );
});

Deno.test("map", () => {
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

Deno.test("mapWithKey", () => {
    const actual = Map.mapWithKey((k: number) => (s: string) =>
        `${k}:${s.toUpperCase()}`
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

Deno.test("traverse", () => {
    const actual = Map.traverse<ListHkt>(monad)((
        value: string,
    ) => fromIterable(value))(Map.fromArray([
        [2, "34"],
        [5, "67"],
    ]));
    const expected = fromIterable([
        Map.fromArray([[2, "3"], [5, "6"]]),
        Map.fromArray([[2, "4"], [5, "6"]]),
        Map.fromArray([[2, "3"], [5, "7"]]),
        Map.fromArray([[2, "4"], [5, "7"]]),
    ]);
    assertEquals(
        listPartialEq(Map.equality<number, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("traverseWithKey", () => {
    const actual = Map.traverseWithKey<OptionHkt>(optionMonad)((k: number) =>
    (
        value: string,
    ) => k % 2 === 0 ? some(value) : none())(
        Map.fromArray([
            [2, "34"],
            [6, "78"],
        ]),
    );
    const expected: Option<Map<number, string>> = some(
        Map.fromArray([[2, "34"], [6, "78"]]),
    );
    assertEquals(
        optionPartialEq(Map.equality<number, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("traverseSomeWIthKey", () => {
    const actual = Map.traverseSomeWithKey<ListHkt>(monad)((k: number) =>
    (
        value: string,
    ) => k % 2 === 0 ? monad.pure(some(value)) : monad.pure(none()))(
        Map.fromArray([
            [2, "34"],
            [5, "67"],
        ]),
    );
    const expected = fromIterable(
        [Map.fromArray([[2, "34"]])],
    );
    assertEquals(
        listPartialEq(Map.equality<number, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("scan", () => {
    const actual = Map.scan(
        (acc: string) => (item: string) => [`${acc} ${item}`, item + "X"],
    )("Everything:")(piMap);
    assertEquals(
        actual,
        [
            "Everything: three one four",
            Map.fromArray([
                [3, "threeX"],
                [1, "oneX"],
                [4, "fourX"],
            ]),
        ],
    );
});

Deno.test("scanWithKey", () => {
    const actual = Map.scanWithKey(
        (acc: string) => (key: number) => (item: string) => [
            `${acc} ${key}-${item}`,
            item + "X",
        ],
    )("Everything:")(piMap);
    assertEquals(
        actual,
        [
            "Everything: 3-three 1-one 4-four",
            Map.fromArray([
                [3, "threeX"],
                [1, "oneX"],
                [4, "fourX"],
            ]),
        ],
    );
});

Deno.test("mapKeys", () => {
    assertEqMap(
        Map.mapKeys((key: number) => key + 1)(piMap),
        Map.fromArray([
            [4, "three"],
            [2, "one"],
            [5, "four"],
        ]),
    );
});

Deno.test("mapKeysWith", () => {
    assertEqMap(
        Map.mapKeysWith((newValue: string) => (oldValue) =>
            `${oldValue} ${newValue}`
        )(() => 1)(piMap),
        Map.singleton(1)("three one four"),
    );
});

Deno.test("foldR", () => {
    const folder = Map.foldR((item: string) => (acc: string) => item + acc)("");
    assertEquals(folder(cases[2]!), "012");
});

Deno.test("foldRWithKey", () => {
    const folder = Map.foldRWithKey(
        (key: string) => (item: string) => (acc: string) =>
            key.length < 4 ? item + acc : acc,
    )("");
    assertEquals(folder(cases[2]!), "12");
});

Deno.test("foldL", () => {
    const folder = Map.foldL((acc: string) => (item: string) => item + acc)("");
    assertEquals(folder(cases[2]!), "210");
});

Deno.test("foldLWithKey", () => {
    const folder = Map.foldLWithKey(
        (key: string) => (acc: string) => (item: string) =>
            key.length < 4 ? item + acc : acc,
    )("");
    assertEquals(folder(cases[2]!), "21");
});

Deno.test("foldMapWithKey", () => {
    const folder = Map.foldMapWithKey(stringMonoid)(
        (key: number) => (value: string) => `${key}:${value}`,
    );

    assertEquals(folder(Map.fromArray([])), "");
    assertEquals(folder(piMap), "3:three1:one4:four");
});

Deno.test("keys", () => {
    assertEquals(toArray(Map.keys(piMap)), [3, 1, 4]);
});
Deno.test("values", () => {
    assertEquals(toArray(Map.values(piMap)), ["three", "one", "four"]);
});
Deno.test("entries", () => {
    assertEquals(toArray(Map.entries(piMap)), [
        [3, "three"],
        [1, "one"],
        [4, "four"],
    ]);
});

Deno.test("sortedEntries", () => {
    assertEquals(
        toArray(Map.sortedEntries({ ordK: ord, ordV: ord })(cases[0]!)),
        [],
    );
    assertEquals(
        toArray(Map.sortedEntries({ ordK: ord, ordV: ord })(cases[1]!)),
        [
            ["1", "one"],
            ["2", "two"],
            ["3", "three"],
            ["4", "four"],
            ["5", "five"],
        ],
    );
});

Deno.test("filter", () => {
    const actual = Map.filter((x: string) => x > "o")(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "three"],
            [1, "one"],
        ]),
    );
});

Deno.test("filterWithKey", () => {
    const actual = Map.filterWithKey((key: number) => (value: string) =>
        key > 2 && value > "o"
    )(piMap);
    assertEqMap(
        actual,
        Map.fromArray([
            [3, "three"],
        ]),
    );
});

Deno.test("partition", () => {
    const actual = Map.partition((x: string) => x > "o")(piMap);
    assertEquals(
        actual,
        [
            Map.fromArray([
                [1, "one"],
                [3, "three"],
            ]),
            Map.fromArray([[4, "four"]]),
        ],
    );
});

Deno.test("partitionWithKey", () => {
    const actual = Map.partitionWithKey((key: number) => (value: string) =>
        key > 2 && value > "o"
    )(piMap);
    assertEquals(
        actual,
        [
            Map.fromArray([
                [3, "three"],
            ]),
            Map.fromArray([
                [1, "one"],
                [4, "four"],
            ]),
        ],
    );
});

Deno.test("mapOption", () => {
    const actual = Map.mapOption((value: string) =>
        value === "three" ? some("new three") : none()
    )(piMap);
    assertEqMap(actual, Map.singleton(3)("new three"));
});

Deno.test("mapOptionWithKey", () => {
    const actual = Map.mapOptionWithKey((key: number) => (value: string) =>
        value === "three" ? some(`${key}:new three`) : none()
    )(piMap);
    assertEqMap(actual, Map.singleton(3)("3:new three"));
});

Deno.test("mapResult", () => {
    const mapper = Map.mapResult((value: string) =>
        value.length < 4 ? Result.ok(value) : Result.err(value)
    );

    assertEquals(mapper(cases[0]!), [Map.fromArray([]), Map.fromArray([])]);
    assertEquals(mapper(cases[1]!), [
        Map.fromArray([["4", "four"], ["3", "three"], ["5", "five"]]),
        Map.fromArray([["1", "one"], ["2", "two"]]),
    ]);
});

Deno.test("mapResultWithKey", () => {
    const mapper = Map.mapResultWithKey((key: string) => (value: string) =>
        key === "1" ? Result.ok(value) : Result.err(value)
    );

    assertEquals(mapper(cases[0]!), [Map.fromArray([]), Map.fromArray([])]);
    assertEquals(mapper(cases[1]!), [
        Map.fromArray([["4", "four"], ["2", "two"], ["3", "three"], [
            "5",
            "five",
        ]]),
        Map.fromArray([["1", "one"]]),
    ]);
});

Deno.test("isSubsetOfBy", () => {
    const isSubsetOfByEq = Map.isSubsetOf(ord);
    const isSubsetOfByLe = Map.isSubsetOfBy((sub: string) => (sup: string) =>
        sub <= sup
    );
    const isSubsetOfByLt = Map.isSubsetOfBy((sub: string) => (sup: string) =>
        sub < sup
    );

    assertEquals(isSubsetOfByEq(Map.fromArray([[1, "one"]]))(piMap), true);
    assertEquals(isSubsetOfByEq(Map.fromArray([[3, "three"]]))(piMap), true);
    assertEquals(isSubsetOfByEq(Map.fromArray([[4, "four"]]))(piMap), true);
    assertEquals(
        isSubsetOfByEq(Map.fromArray([[1, "one"], [3, "three"]]))(piMap),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Map.fromArray([[3, "three"], [4, "four"]]))(piMap),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Map.fromArray([[1, "one"], [4, "four"]]))(piMap),
        true,
    );
    assertEquals(isSubsetOfByEq(piMap)(piMap), true);
    assertEquals(isSubsetOfByLe(Map.fromArray([[1, "one"]]))(piMap), true);

    assertEquals(isSubsetOfByEq(Map.fromArray([[1, "two"]]))(piMap), false);
    assertEquals(isSubsetOfByLt(Map.fromArray([[1, "one"]]))(piMap), false);

    assertEquals(isSubsetOfByEq(piMap)(Map.fromArray([[1, "one"]])), false);
});

Deno.test("isProperSubsetOfBy", () => {
    const isProperSubsetOfByEq = Map.isProperSubsetOf(ord);
    const isProperSubsetOfByLe = Map.isProperSubsetOfBy(
        (sub: string) => (sup: string) => sub <= sup,
    );
    const isProperSubsetOfByLt = Map.isProperSubsetOfBy(
        (sub: string) => (sup: string) => sub < sup,
    );

    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[1, "one"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[3, "three"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[4, "four"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[1, "one"], [3, "three"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[3, "three"], [4, "four"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[1, "one"], [4, "four"]]))(piMap),
        true,
    );
    assertEquals(
        isProperSubsetOfByLe(Map.fromArray([[1, "one"]]))(piMap),
        true,
    );

    assertEquals(isProperSubsetOfByEq(piMap)(piMap), false);
    assertEquals(
        isProperSubsetOfByEq(Map.fromArray([[1, "two"]]))(piMap),
        false,
    );
    assertEquals(
        isProperSubsetOfByLt(Map.fromArray([[1, "one"]]))(piMap),
        false,
    );

    assertEquals(
        isProperSubsetOfByEq(piMap)(Map.fromArray([[1, "one"]])),
        false,
    );
});

Deno.test("countItems", () => {
    const res = Map.countItems(fromIterable([1, 4, 2, 3, 5, 2, 3]));
    assertEquals(res.get(0), undefined);
    assertEquals(res.get(1), 1);
    assertEquals(res.get(2), 2);
    assertEquals(res.get(3), 2);
    assertEquals(res.get(4), 1);
    assertEquals(res.get(5), 1);
    assertEquals(res.get(6), undefined);
});

Deno.test("functor laws", () => {
    const f = Map.functor<string>();
    // identity
    for (const item of cases) {
        assertEquals(f.map((x: string) => x)(item), item);
    }

    // composition
    const bang = (x: string) => x + "!";
    const question = (x: string) => x + "?";
    for (const item of cases) {
        assertEquals(
            f.map((x: string) => question(bang(x)))(item),
            f.map(question)(f.map(bang)(item)),
        );
    }
});

Deno.test("foldable functor laws", () => {
    const f = Map.foldable<string>();

    const folder = f.foldR((item: string) => (acc: string) => item + acc)("");
    assertEquals(folder(cases[2]!), "012");
});

Deno.test("traversable functor laws", () => {
    const t = Map.traversable<number>();

    const actual = t.traverse<ListHkt>(monad)((
        value: string,
    ) => fromIterable(value))(Map.fromArray([
        [2, "34"],
        [5, "67"],
    ]));
    const expected = fromIterable([
        Map.fromArray([[2, "3"], [5, "6"]]),
        Map.fromArray([[2, "4"], [5, "6"]]),
        Map.fromArray([[2, "3"], [5, "7"]]),
        Map.fromArray([[2, "4"], [5, "7"]]),
    ]);
    assertEquals(
        listPartialEq(Map.equality<number, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("encode then decode", () => {
    const data = cases[1]!;
    const code = runCode(Map.enc(encUtf8)(encUtf8)(data));
    const decoded = Result.unwrap(
        runDecoder(Map.dec(decUtf8())(decUtf8()))(code),
    );
    assertEquals(data, decoded);
});
