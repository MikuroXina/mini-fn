import { assertEquals } from "../deps.ts";
import {
    monad as optionMonad,
    none,
    Option,
    OptionHkt,
    partialEq as optionPartialEq,
    some,
} from "./option.ts";
import * as Record from "./record.ts";
import {
    fromIterable,
    ListHkt,
    monad,
    partialEq as listPartialEq,
} from "./list.ts";
import { ord } from "./string.ts";

const assertEqRecord = (
    actual: Record<string, number>,
    expected: Record<string, number>,
) => assertEquals(
    actual,
    expected,
);

const piRecord: Record<string, number> = Record.fromArray([["three", 3], [
    "one",
    1,
], ["four", 4]]);

Deno.test("isEmpty", () => {
    assertEquals(Record.isEmpty(Record.empty()), true);
    assertEquals(Record.isEmpty(Record.singleton("one")(1)), false);
});

Deno.test("size", () => {
    assertEquals(Record.size(Record.empty()), 0);
    assertEquals(Record.size(Record.singleton("one")(1)), 1);
    assertEquals(Record.size(piRecord), 3);
});

Deno.test("has", () => {
    assertEquals(Record.has("three")(piRecord), true);
    assertEquals(Record.has("one")(piRecord), true);
    assertEquals(Record.has("four")(piRecord), true);
    assertEquals(Record.has("zero")(piRecord), false);
});

Deno.test("get", () => {
    assertEquals(Record.get("three")(piRecord), some(3));
    assertEquals(Record.get("one")(piRecord), some(1));
    assertEquals(Record.get("four")(piRecord), some(4));
    assertEquals(Record.get("zero")(piRecord), none());
});

Deno.test("insert", () => {
    assertEqRecord(Record.insert("one")(1)(piRecord), piRecord);
    assertEqRecord(
        Record.insert("one")(1)(Record.empty()),
        Record.singleton("one")(1),
    );
});

Deno.test("remove", () => {
    const expected = Record.fromArray([["three", 3], ["four", 4]]);
    assertEqRecord(Record.remove("one")(piRecord), expected);

    assertEqRecord(Record.remove("one")(Record.empty()), Record.empty());
});

Deno.test("adjust", () => {
    const adjuster = Record.adjust((x: number) => x + 1);
    assertEqRecord(
        adjuster("three")(piRecord),
        Record.fromArray([["three", 4], ["one", 1], ["four", 4]]),
    );
    assertEqRecord(adjuster("zero")(piRecord), piRecord);
    assertEqRecord(adjuster("zero")(Record.empty()), Record.empty());
});

Deno.test("adjustWithKey", () => {
    const adjuster = Record.adjustWithKey<string, number>((key) => (value) =>
        key === "three" ? value + 1 : value - 1
    );
    assertEqRecord(
        adjuster("three")(piRecord),
        Record.fromArray([["three", 4], ["one", 1], ["four", 4]]),
    );
    assertEqRecord(adjuster("zero")(piRecord), piRecord);
    assertEqRecord(adjuster("zero")(Record.empty()), Record.empty());
});

Deno.test("update", () => {
    const updater = Record.update((x: number) =>
        x === 3 ? some(x + 1) : none()
    );

    assertEqRecord(
        updater("three")(piRecord),
        Record.fromArray([["three", 4], ["one", 1], ["four", 4]]),
    );
    assertEqRecord(updater("zero")(piRecord), piRecord);
    assertEqRecord(
        updater("one")(piRecord),
        Record.fromArray([["three", 3], ["four", 4]]),
    );
});

Deno.test("updateWithKey", () => {
    const updater = Record.updateWithKey<string, number>((key) => (value) =>
        key === "three" ? some(value + 1) : none()
    );

    assertEqRecord(
        updater("three")(piRecord),
        Record.fromArray([["three", 4], ["one", 1], ["four", 4]]),
    );
    assertEqRecord(
        updater("one")(piRecord),
        Record.fromArray([["three", 3], ["four", 4]]),
    );
    assertEqRecord(updater("zero")(piRecord), piRecord);
});

Deno.test("alter", () => {
    const alterer1 = Record.alter<number>(() => none());
    assertEqRecord(alterer1("zero")(piRecord), piRecord);
    assertEqRecord(
        alterer1("one")(piRecord),
        Record.fromArray([["three", 3], ["four", 4]]),
    );

    const alterer2 = Record.alter<number>(() => some(-1));
    assertEqRecord(
        alterer2("zero")(piRecord),
        Record.fromArray([["three", 3], ["four", 4], ["one", 1], ["zero", -1]]),
    );
    assertEqRecord(
        alterer2("one")(piRecord),
        Record.fromArray([["three", 3], ["one", -1], ["four", 4]]),
    );
});

Deno.test("union", () => {
    const actual = Record.union(Record.fromArray<string, number>([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 22],
        ["three", 33],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([["two", 2], ["five", 5], ["three", 33]]),
    );
});

Deno.test("unionWith", () => {
    const actual = Record.unionWith<number>((l) => (r) => l + r)(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(Record.fromArray([
        ["two", 2],
        ["three", 3],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([["two", 4], ["five", 5], ["three", 3]]),
    );
});

Deno.test("unionWithKey", () => {
    const actual = Record.unionWithKey<string, number>((k) => (l) => (r) =>
        k === k.toLowerCase() ? l + r : l
    )(Record.fromArray<string, number>([
        ["two", 2],
        ["FIVE", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["three", 3],
        ["FIVE", 4],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([["two", 4], ["FIVE", 5], ["three", 3]]),
    );
});

Deno.test("difference", () => {
    const actual = Record.difference(Record.fromArray<string, number>([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["THREE", 3],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["five", 5],
        ]),
    );
});

Deno.test("differenceWith", () => {
    const actual = Record.differenceWith<number>((l) => (r) =>
        l === 5 ? some(l + r) : none()
    )(Record.fromArray<string, number>([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["three", 3],
        ["five", 5],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["five", 10],
        ]),
    );
});

Deno.test("differenceWithKey", () => {
    const actual = Record.differenceWithKey<string, number>(
        (key) => (l) => (r) => key === "five" ? some(l + r) : none(),
    )(Record.fromArray([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["three", 3],
        ["five", 5],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["five", 10],
        ]),
    );
});

Deno.test("intersection", () => {
    const actual = Record.intersection(Record.fromArray<string, number>([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["three", 3],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray<string, number>([
            ["two", 2],
        ]),
    );
});

Deno.test("intersectionWith", () => {
    const actual = Record.intersectionWith<number>((l) => (r) => l + r)(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(Record.fromArray([
        ["two", 2],
        ["THREE", 3],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["two", 4],
        ]),
    );
});

Deno.test("intersectionWithKey", () => {
    const actual = Record.intersectionWithKey<string, number>(
        (k) => (l) => (r) => k === "two" ? l + r : l,
    )(Record.fromArray<string, number>([
        ["two", 2],
        ["five", 5],
    ]))(Record.fromArray([
        ["two", 2],
        ["three", 3],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["two", 4],
        ]),
    );
});

Deno.test("isDisjoint", () => {
    assertEquals(
        Record.isDisjoint(piRecord)(Record.fromArray([["one", 1]])),
        false,
    );
    assertEquals(
        Record.isDisjoint(piRecord)(Record.fromArray([["two", 1]])),
        true,
    );
    assertEquals(
        Record.isDisjoint(Record.empty())(Record.fromArray([["zero", 0]])),
        true,
    );
    assertEquals(Record.isDisjoint(piRecord)(Record.empty()), true);
    assertEquals(Record.isDisjoint(Record.empty())(Record.empty()), true);
});

Deno.test("compose", () => {
    const actual = Record.compose(piRecord)(Record.fromArray<string, string>([
        ["TWO", "two"],
        ["THREE", "three"],
        ["FOUR", "four"],
    ]));
    assertEqRecord(
        actual,
        Record.fromArray([
            ["THREE", 3],
            ["FOUR", 4],
        ]),
    );
});

Deno.test("map", () => {
    const actual = Record.map((x: number) => x * 10)(piRecord);
    assertEqRecord(
        actual,
        Record.fromArray([
            ["three", 30],
            ["one", 10],
            ["four", 40],
        ]),
    );
});

Deno.test("mapWithKey", () => {
    const actual = Record.mapWithKey((k: string) => (v: number) =>
        k === k.toLowerCase() ? v * 10 : v
    )(piRecord);
    assertEqRecord(
        actual,
        Record.fromArray([
            ["three", 30],
            ["one", 10],
            ["four", 40],
        ]),
    );
});

Deno.test("traverse", () => {
    const actual = Record.traverse<ListHkt>(monad)((
        value: number,
    ) => fromIterable(`${value}`))(Record.fromArray<string, number>([
        ["2", 34],
        ["5", 67],
    ]));
    const expected = fromIterable([
        Record.fromArray([["2", "3"], ["5", "6"]]),
        Record.fromArray([["2", "4"], ["5", "6"]]),
        Record.fromArray([["2", "3"], ["5", "7"]]),
        Record.fromArray([["2", "4"], ["5", "7"]]),
    ]);
    assertEquals(
        listPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("traverseWithKey", () => {
    const actual = Record.traverseWithKey<OptionHkt>(optionMonad)(
        (key: string) => (value: number) =>
            value % 2 === 0 ? some(key) : none(),
    )(
        Record.fromArray([
            ["2", 34],
            ["6", 78],
        ]),
    );
    const expected: Option<Record<string, string>> = some(
        Record.fromArray([["2", "2"], ["6", "6"]]),
    );
    assertEquals(
        optionPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("traverseSomeWithKey", () => {
    const actual = Record.traverseSomeWithKey<ListHkt>(monad)(
        (key: string) => (value: number) =>
            value % 2 === 0 ? monad.pure(some(key)) : monad.pure(none()),
    )(
        Record.fromArray([
            ["2", 34],
            ["5", 67],
        ]),
    );
    const expected = fromIterable(
        [Record.fromArray<string, string>([["2", "2"]])],
    );
    assertEquals(
        listPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
        true,
    );
});

Deno.test("scan", () => {
    const actual = Record.scan(
        (acc: string) => (item: number) => [`${acc} ${item}`, item + "X"],
    )("Everything:")(piRecord);
    assertEquals(
        actual,
        [
            "Everything: 3 1 4",
            Record.fromArray([
                ["three", "3X"],
                ["one", "1X"],
                ["four", "4X"],
            ]),
        ],
    );
});

Deno.test("scanWithKey", () => {
    const actual = Record.scanWithKey(
        (acc: string) => (key: string) => (item: number) => [
            `${acc} ${key}-${item}`,
            item + "X",
        ],
    )("Everything:")(piRecord);
    assertEquals(
        actual,
        [
            "Everything: three-3 one-1 four-4",
            Record.fromArray([
                ["three", "3X"],
                ["one", "1X"],
                ["four", "4X"],
            ]),
        ],
    );
});

Deno.test("mapKeys", () => {
    assertEqRecord(
        Record.mapKeys((key: string) => key + "1")(piRecord),
        Record.fromArray([
            ["three1", 3],
            ["one1", 1],
            ["four1", 4],
        ]),
    );
});

Deno.test("mapKeysWith", () => {
    assertEqRecord(
        Record.mapKeysWith((newValue: number) => (oldValue) =>
            newValue + oldValue * 10
        )(() => "1")(piRecord),
        Record.singleton("1")(314),
    );
});

Deno.test("foldR", () => {
    const folder = Record.foldR((item: number) => (acc: number) => item + acc)(
        0,
    );
    assertEquals(folder(piRecord), 8);
});

Deno.test("filter", () => {
    const actual = Record.filter((x: number) => x > 2)(piRecord);
    assertEqRecord(
        actual,
        Record.fromArray([
            ["three", 3],
            ["four", 4],
        ]),
    );
});

Deno.test("filterWithKey", () => {
    const actual = Record.filterWithKey((key: string) => (value: number) =>
        key > "o" && value > 2
    )(piRecord);
    assertEqRecord(
        actual,
        Record.fromArray([
            ["three", 3],
        ]),
    );
});

Deno.test("partition", () => {
    const actual = Record.partition((x: number) => x > 2)(piRecord);
    assertEquals(
        actual,
        [
            Record.fromArray([
                ["four", 4],
                ["three", 3],
            ]),
            Record.fromArray([["one", 1]]),
        ],
    );
});

Deno.test("partitionWithKey", () => {
    const actual = Record.partitionWithKey((key: string) => (value: number) =>
        key > "o" && value > 2
    )(piRecord);
    assertEquals(
        actual,
        [
            Record.fromArray([
                ["three", 3],
            ]),
            Record.fromArray([
                ["one", 1],
                ["four", 4],
            ]),
        ],
    );
});

Deno.test("mapOption", () => {
    const actual = Record.mapOption((value: number) =>
        value === 3 ? some(value + 1) : none()
    )(piRecord);
    assertEqRecord(actual, Record.singleton("three")(4));
});

Deno.test("mapOptionWithKey", () => {
    const actual = Record.mapOptionWithKey(
        (key: string) => (value: number) =>
            key === "three" ? some(value + 1) : none(),
    )(piRecord);
    assertEqRecord(actual, Record.singleton("three")(4));
});

Deno.test("isSubsetOfBy", () => {
    const isSubsetOfByEq = Record.isSubsetOfBy((sub: number) => (sup: number) =>
        sub === sup
    );
    const isSubsetOfByLe = Record.isSubsetOfBy((sub: number) => (sup: number) =>
        sub <= sup
    );
    const isSubsetOfByLt = Record.isSubsetOfBy((sub: number) => (sup: number) =>
        sub < sup
    );

    assertEquals(
        isSubsetOfByEq(Record.fromArray([["one", 1]]))(piRecord),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Record.fromArray([["three", 3]]))(piRecord),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Record.fromArray([["four", 4]]))(piRecord),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Record.fromArray([["one", 1], ["three", 3]]))(piRecord),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Record.fromArray([["three", 3], ["four", 4]]))(piRecord),
        true,
    );
    assertEquals(
        isSubsetOfByEq(Record.fromArray([["one", 1], ["four", 4]]))(piRecord),
        true,
    );
    assertEquals(isSubsetOfByEq(piRecord)(piRecord), true);
    assertEquals(
        isSubsetOfByLe(Record.fromArray([["one", 1]]))(piRecord),
        true,
    );

    assertEquals(
        isSubsetOfByEq(Record.fromArray([["two", 1]]))(piRecord),
        false,
    );
    assertEquals(
        isSubsetOfByLt(Record.fromArray([["one", 1]]))(piRecord),
        false,
    );
});

Deno.test("isProperSubsetOfBy", () => {
    const isProperSubsetOfByEq = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub === sup,
    );
    const isProperSubsetOfByLe = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub <= sup,
    );
    const isProperSubsetOfByLt = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub < sup,
    );

    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["one", 1]]))(piRecord),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["three", 3]]))(piRecord),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["four", 4]]))(piRecord),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["one", 1], ["three", 3]]))(
            piRecord,
        ),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["three", 3], ["four", 4]]))(
            piRecord,
        ),
        true,
    );
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["one", 1], ["four", 4]]))(
            piRecord,
        ),
        true,
    );
    assertEquals(
        isProperSubsetOfByLe(Record.fromArray([["one", 1]]))(piRecord),
        true,
    );

    assertEquals(isProperSubsetOfByEq(piRecord)(piRecord), false);
    assertEquals(
        isProperSubsetOfByEq(Record.fromArray([["two", 1]]))(piRecord),
        false,
    );
    assertEquals(
        isProperSubsetOfByLt(Record.fromArray([["one", 1]]))(piRecord),
        false,
    );
});
