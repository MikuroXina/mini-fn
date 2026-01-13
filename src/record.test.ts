import { expect, test } from "vitest";
import {
    fromIterable,
    type ListHkt,
    partialEq as listPartialEq,
    monad,
} from "./list.js";
import {
    none,
    type Option,
    type OptionHkt,
    monad as optionMonad,
    partialEq as optionPartialEq,
    some,
} from "./option.js";
import * as Record from "./record.js";
import { ord } from "./string.js";

const assertEqRecord = (
    actual: Record<string, number>,
    expected: Record<string, number>,
) => expect(actual).toStrictEqual(expected);

const piRecord: Record<string, number> = Record.fromArray([
    ["three", 3],
    ["one", 1],
    ["four", 4],
]);

test("isEmpty", () => {
    expect(Record.isEmpty(Record.empty())).toStrictEqual(true);
    expect(Record.isEmpty(Record.singleton("one")(1))).toStrictEqual(false);
});

test("size", () => {
    expect(Record.size(Record.empty())).toStrictEqual(0);
    expect(Record.size(Record.singleton("one")(1))).toStrictEqual(1);
    expect(Record.size(piRecord)).toStrictEqual(3);
});

test("has", () => {
    expect(Record.has("three")(piRecord)).toStrictEqual(true);
    expect(Record.has("one")(piRecord)).toStrictEqual(true);
    expect(Record.has("four")(piRecord)).toStrictEqual(true);
    expect(Record.has("zero")(piRecord)).toStrictEqual(false);
});

test("get", () => {
    expect(Record.get("three")(piRecord)).toStrictEqual(some(3));
    expect(Record.get("one")(piRecord)).toStrictEqual(some(1));
    expect(Record.get("four")(piRecord)).toStrictEqual(some(4));
    expect(Record.get("zero")(piRecord)).toStrictEqual(none());
});

test("insert", () => {
    assertEqRecord(Record.insert("one")(1)(piRecord), piRecord);
    assertEqRecord(
        Record.insert("one")(1)(Record.empty()),
        Record.singleton("one")(1),
    );
});

test("remove", () => {
    const expected = Record.fromArray([
        ["three", 3],
        ["four", 4],
    ]);
    assertEqRecord(Record.remove("one")(piRecord), expected);

    assertEqRecord(Record.remove("one")(Record.empty()), Record.empty());
});

test("adjust", () => {
    const adjuster = Record.adjust((x: number) => x + 1);
    assertEqRecord(
        adjuster("three")(piRecord),
        Record.fromArray([
            ["three", 4],
            ["one", 1],
            ["four", 4],
        ]),
    );
    assertEqRecord(adjuster("zero")(piRecord), piRecord);
    assertEqRecord(adjuster("zero")(Record.empty()), Record.empty());
});

test("adjustWithKey", () => {
    const adjuster = Record.adjustWithKey<string, number>(
        (key) => (value) => (key === "three" ? value + 1 : value - 1),
    );
    assertEqRecord(
        adjuster("three")(piRecord),
        Record.fromArray([
            ["three", 4],
            ["one", 1],
            ["four", 4],
        ]),
    );
    assertEqRecord(adjuster("zero")(piRecord), piRecord);
    assertEqRecord(adjuster("zero")(Record.empty()), Record.empty());
});

test("update", () => {
    const updater = Record.update((x: number) =>
        x === 3 ? some(x + 1) : none(),
    );

    assertEqRecord(
        updater("three")(piRecord),
        Record.fromArray([
            ["three", 4],
            ["one", 1],
            ["four", 4],
        ]),
    );
    assertEqRecord(updater("zero")(piRecord), piRecord);
    assertEqRecord(
        updater("one")(piRecord),
        Record.fromArray([
            ["three", 3],
            ["four", 4],
        ]),
    );
});

test("updateWithKey", () => {
    const updater = Record.updateWithKey<string, number>(
        (key) => (value) => (key === "three" ? some(value + 1) : none()),
    );

    assertEqRecord(
        updater("three")(piRecord),
        Record.fromArray([
            ["three", 4],
            ["one", 1],
            ["four", 4],
        ]),
    );
    assertEqRecord(
        updater("one")(piRecord),
        Record.fromArray([
            ["three", 3],
            ["four", 4],
        ]),
    );
    assertEqRecord(updater("zero")(piRecord), piRecord);
});

test("alter", () => {
    const alterer1 = Record.alter<number>(() => none());
    assertEqRecord(alterer1("zero")(piRecord), piRecord);
    assertEqRecord(
        alterer1("one")(piRecord),
        Record.fromArray([
            ["three", 3],
            ["four", 4],
        ]),
    );

    const alterer2 = Record.alter<number>(() => some(-1));
    assertEqRecord(
        alterer2("zero")(piRecord),
        Record.fromArray([
            ["three", 3],
            ["four", 4],
            ["one", 1],
            ["zero", -1],
        ]),
    );
    assertEqRecord(
        alterer2("one")(piRecord),
        Record.fromArray([
            ["three", 3],
            ["one", -1],
            ["four", 4],
        ]),
    );
});

test("union", () => {
    const actual = Record.union(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 22],
            ["three", 33],
        ]),
    );
    assertEqRecord(
        actual,
        Record.fromArray([
            ["two", 2],
            ["five", 5],
            ["three", 33],
        ]),
    );
});

test("unionWith", () => {
    const actual = Record.unionWith<number>((l) => (r) => l + r)(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
        ]),
    );
    assertEqRecord(
        actual,
        Record.fromArray([
            ["two", 4],
            ["five", 5],
            ["three", 3],
        ]),
    );
});

test("unionWithKey", () => {
    const actual = Record.unionWithKey<string, number>(
        (k) => (l) => (r) => (k === k.toLowerCase() ? l + r : l),
    )(
        Record.fromArray<string, number>([
            ["two", 2],
            ["FIVE", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
            ["FIVE", 4],
        ]),
    );
    assertEqRecord(
        actual,
        Record.fromArray([
            ["two", 4],
            ["FIVE", 5],
            ["three", 3],
        ]),
    );
});

test("difference", () => {
    const actual = Record.difference(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["THREE", 3],
        ]),
    );
    assertEqRecord(actual, Record.fromArray([["five", 5]]));
});

test("differenceWith", () => {
    const actual = Record.differenceWith<number>(
        (l) => (r) => (l === 5 ? some(l + r) : none()),
    )(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
            ["five", 5],
        ]),
    );
    assertEqRecord(actual, Record.fromArray([["five", 10]]));
});

test("differenceWithKey", () => {
    const actual = Record.differenceWithKey<string, number>(
        (key) => (l) => (r) => (key === "five" ? some(l + r) : none()),
    )(
        Record.fromArray([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
            ["five", 5],
        ]),
    );
    assertEqRecord(actual, Record.fromArray([["five", 10]]));
});

test("intersection", () => {
    const actual = Record.intersection(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
        ]),
    );
    assertEqRecord(actual, Record.fromArray<string, number>([["two", 2]]));
});

test("intersectionWith", () => {
    const actual = Record.intersectionWith<number>((l) => (r) => l + r)(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["THREE", 3],
        ]),
    );
    assertEqRecord(actual, Record.fromArray([["two", 4]]));
});

test("intersectionWithKey", () => {
    const actual = Record.intersectionWithKey<string, number>(
        (k) => (l) => (r) => (k === "two" ? l + r : l),
    )(
        Record.fromArray<string, number>([
            ["two", 2],
            ["five", 5],
        ]),
    )(
        Record.fromArray([
            ["two", 2],
            ["three", 3],
        ]),
    );
    assertEqRecord(actual, Record.fromArray([["two", 4]]));
});

test("isDisjoint", () => {
    expect(
        Record.isDisjoint(piRecord)(Record.fromArray([["one", 1]])),
    ).toStrictEqual(false);
    expect(
        Record.isDisjoint(piRecord)(Record.fromArray([["two", 1]])),
    ).toStrictEqual(true);
    expect(
        Record.isDisjoint(Record.empty())(Record.fromArray([["zero", 0]])),
    ).toStrictEqual(true);
    expect(Record.isDisjoint(piRecord)(Record.empty())).toStrictEqual(true);
    expect(Record.isDisjoint(Record.empty())(Record.empty())).toStrictEqual(
        true,
    );
});

test("compose", () => {
    const actual = Record.compose(piRecord)(
        Record.fromArray<string, string>([
            ["TWO", "two"],
            ["THREE", "three"],
            ["FOUR", "four"],
        ]),
    );
    assertEqRecord(
        actual,
        Record.fromArray([
            ["THREE", 3],
            ["FOUR", 4],
        ]),
    );
});

test("map", () => {
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

test("mapWithKey", () => {
    const actual = Record.mapWithKey(
        (k: string) => (v: number) => (k === k.toLowerCase() ? v * 10 : v),
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

test("traverse", () => {
    const actual = Record.traverse<ListHkt>(monad)((value: number) =>
        fromIterable(`${value}`),
    )(
        Record.fromArray<string, number>([
            ["2", 34],
            ["5", 67],
        ]),
    );
    const expected = fromIterable([
        Record.fromArray([
            ["2", "3"],
            ["5", "6"],
        ]),
        Record.fromArray([
            ["2", "4"],
            ["5", "6"],
        ]),
        Record.fromArray([
            ["2", "3"],
            ["5", "7"],
        ]),
        Record.fromArray([
            ["2", "4"],
            ["5", "7"],
        ]),
    ]);
    expect(
        listPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
    ).toStrictEqual(true);
});

test("traverseWithKey", () => {
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
        Record.fromArray([
            ["2", "2"],
            ["6", "6"],
        ]),
    );
    expect(
        optionPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
    ).toStrictEqual(true);
});

test("traverseSomeWithKey", () => {
    const actual = Record.traverseSomeWithKey<ListHkt>(monad)(
        (key: string) => (value: number) =>
            value % 2 === 0 ? monad.pure(some(key)) : monad.pure(none()),
    )(
        Record.fromArray([
            ["2", 34],
            ["5", 67],
        ]),
    );
    const expected = fromIterable([
        Record.fromArray<string, string>([["2", "2"]]),
    ]);
    expect(
        listPartialEq(Record.equality<string, string>(ord)).eq(
            actual,
            expected,
        ),
    ).toStrictEqual(true);
});

test("scan", () => {
    const actual = Record.scan((acc: string) => (item: number) => [
        `${acc} ${item}`,
        `${item}X`,
    ])("Everything:")(piRecord);
    expect(actual).toStrictEqual([
        "Everything: 3 1 4",
        Record.fromArray([
            ["three", "3X"],
            ["one", "1X"],
            ["four", "4X"],
        ]),
    ]);
});

test("scanWithKey", () => {
    const actual = Record.scanWithKey(
        (acc: string) => (key: string) => (item: number) => [
            `${acc} ${key}-${item}`,
            `${item}X`,
        ],
    )("Everything:")(piRecord);
    expect(actual).toStrictEqual([
        "Everything: three-3 one-1 four-4",
        Record.fromArray([
            ["three", "3X"],
            ["one", "1X"],
            ["four", "4X"],
        ]),
    ]);
});

test("mapKeys", () => {
    assertEqRecord(
        Record.mapKeys((key: string) => `${key}1`)(piRecord),
        Record.fromArray([
            ["three1", 3],
            ["one1", 1],
            ["four1", 4],
        ]),
    );
});

test("mapKeysWith", () => {
    assertEqRecord(
        Record.mapKeysWith(
            (newValue: number) => (oldValue) => newValue + oldValue * 10,
        )(() => "1")(piRecord),
        Record.singleton("1")(314),
    );
});

test("foldR", () => {
    const folder = Record.foldR((item: number) => (acc: number) => item + acc)(
        0,
    );
    expect(folder(piRecord)).toStrictEqual(8);
});

test("filter", () => {
    const actual = Record.filter((x: number) => x > 2)(piRecord);
    assertEqRecord(
        actual,
        Record.fromArray([
            ["three", 3],
            ["four", 4],
        ]),
    );
});

test("filterWithKey", () => {
    const actual = Record.filterWithKey(
        (key: string) => (value: number) => key > "o" && value > 2,
    )(piRecord);
    assertEqRecord(actual, Record.fromArray([["three", 3]]));
});

test("partition", () => {
    const actual = Record.partition((x: number) => x > 2)(piRecord);
    expect(actual).toStrictEqual([
        Record.fromArray([
            ["four", 4],
            ["three", 3],
        ]),
        Record.fromArray([["one", 1]]),
    ]);
});

test("partitionWithKey", () => {
    const actual = Record.partitionWithKey(
        (key: string) => (value: number) => key > "o" && value > 2,
    )(piRecord);
    expect(actual).toStrictEqual([
        Record.fromArray([["three", 3]]),
        Record.fromArray([
            ["one", 1],
            ["four", 4],
        ]),
    ]);
});

test("mapOption", () => {
    const actual = Record.mapOption((value: number) =>
        value === 3 ? some(value + 1) : none(),
    )(piRecord);
    assertEqRecord(actual, Record.singleton("three")(4));
});

test("mapOptionWithKey", () => {
    const actual = Record.mapOptionWithKey(
        (key: string) => (value: number) =>
            key === "three" ? some(value + 1) : none(),
    )(piRecord);
    assertEqRecord(actual, Record.singleton("three")(4));
});

test("isSubsetOfBy", () => {
    const isSubsetOfByEq = Record.isSubsetOfBy(
        (sub: number) => (sup: number) => sub === sup,
    );
    const isSubsetOfByLe = Record.isSubsetOfBy(
        (sub: number) => (sup: number) => sub <= sup,
    );
    const isSubsetOfByLt = Record.isSubsetOfBy(
        (sub: number) => (sup: number) => sub < sup,
    );

    expect(
        isSubsetOfByEq(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(Record.fromArray([["three", 3]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(Record.fromArray([["four", 4]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(
            Record.fromArray([
                ["one", 1],
                ["three", 3],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(
            Record.fromArray([
                ["three", 3],
                ["four", 4],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(
        isSubsetOfByEq(
            Record.fromArray([
                ["one", 1],
                ["four", 4],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(isSubsetOfByEq(piRecord)(piRecord)).toStrictEqual(true);
    expect(
        isSubsetOfByLe(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(true);

    expect(
        isSubsetOfByEq(Record.fromArray([["two", 1]]))(piRecord),
    ).toStrictEqual(false);
    expect(
        isSubsetOfByLt(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(false);
});

test("isProperSubsetOfBy", () => {
    const isProperSubsetOfByEq = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub === sup,
    );
    const isProperSubsetOfByLe = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub <= sup,
    );
    const isProperSubsetOfByLt = Record.isProperSubsetOfBy(
        (sub: number) => (sup: number) => sub < sup,
    );

    expect(
        isProperSubsetOfByEq(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(Record.fromArray([["three", 3]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(Record.fromArray([["four", 4]]))(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Record.fromArray([
                ["one", 1],
                ["three", 3],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Record.fromArray([
                ["three", 3],
                ["four", 4],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByEq(
            Record.fromArray([
                ["one", 1],
                ["four", 4],
            ]),
        )(piRecord),
    ).toStrictEqual(true);
    expect(
        isProperSubsetOfByLe(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(true);

    expect(isProperSubsetOfByEq(piRecord)(piRecord)).toStrictEqual(false);
    expect(
        isProperSubsetOfByEq(Record.fromArray([["two", 1]]))(piRecord),
    ).toStrictEqual(false);
    expect(
        isProperSubsetOfByLt(Record.fromArray([["one", 1]]))(piRecord),
    ).toStrictEqual(false);
});
