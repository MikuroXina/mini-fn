import { assertEquals } from "../deps.ts";
import {
    monad as optionMonad,
    none,
    type Option,
    type OptionHkt,
    partialEq as optionPartialEq,
    some,
} from "./option.ts";
import { ord } from "./string.ts";
import * as Map from "./map.ts";
import {
    fromIterable,
    type ListHkt,
    monad,
    partialEq as listPartialEq,
} from "./list.ts";

const assertEqMap = (
    actual: Map<number, string>,
    expected: Map<number, string>,
) => assertEquals(Map.eq<number, string>(ord)(actual, expected), true);

const piMap = Map.fromArray([[3, "three"], [1, "one"], [4, "four"]]);

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

Deno.test("insert", () => {
    assertEqMap(Map.insert(1)("one")(piMap), piMap);
    assertEqMap(Map.insert(1)("one")(Map.empty()), Map.singleton(1)("one"));
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
    const folder = Map.foldR((item: string) => (acc: number) =>
        item.length + acc
    )(0);
    assertEquals(folder(piMap), 12);
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

Deno.test("isSubsetOfBy", () => {
    const isSubsetOfByEq = Map.isSubsetOfBy((sub: string) => (sup: string) =>
        sub === sup
    );
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
});

Deno.test("isProperSubsetOfBy", () => {
    const isProperSubsetOfByEq = Map.isProperSubsetOfBy(
        (sub: string) => (sup: string) => sub === sup,
    );
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
