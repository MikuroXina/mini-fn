import { expect, test } from "vitest";
import { hash as bigintHash } from "./big-int.js";
import * as Hash from "./hash.js";
import { doMut, newMutRef, readMutRef } from "./mut.js";
import * as Option from "./option.js";
import { hash as stringHash } from "./string.js";
import type { Hasher } from "./type-class/hash.js";

test("book reviews example", () => {
    const map = Hash.newMap<string, string>();

    const insert = Hash.insert(stringHash);
    const actual = doMut((cat) =>
        cat
            .addM("map", newMutRef(map))
            .addMWith("_", ({ map }) =>
                insert("Adventures of Huckleberry Finn")("My favorite book.")(
                    map,
                ),
            )
            .addMWith("_", ({ map }) =>
                insert("Grimms' Fairy Tales")("Masterpiece.")(map),
            )
            .addMWith("_", ({ map }) =>
                insert("Pride and Prejudice")("Very enjoyable.")(map),
            )
            .addMWith("_", ({ map }) =>
                insert("The Adventures of Sherlock Holmes")(
                    "Eye lyked it alot.",
                )(map),
            )
            .finishM(({ map }) => readMutRef(map)),
    );

    expect(
        Hash.contains(stringHash)("The Adventures of Sherlock Holmes")(actual),
    ).toStrictEqual(true);
    expect(Hash.contains(stringHash)("Les Misérables")(actual)).toStrictEqual(
        false,
    );

    expect([...Hash.entries(actual)]).toStrictEqual([
        ["Pride and Prejudice", "Very enjoyable."],
        ["Adventures of Huckleberry Finn", "My favorite book."],
        ["Grimms' Fairy Tales", "Masterpiece."],
        ["The Adventures of Sherlock Holmes", "Eye lyked it alot."],
    ]);
    expect([...Hash.keys(actual)]).toStrictEqual([
        "Pride and Prejudice",
        "Adventures of Huckleberry Finn",
        "Grimms' Fairy Tales",
        "The Adventures of Sherlock Holmes",
    ]);
    expect([...Hash.values(actual)]).toStrictEqual([
        "Very enjoyable.",
        "My favorite book.",
        "Masterpiece.",
        "Eye lyked it alot.",
    ]);
});

test("insert and remove many items", () => {
    let map = Hash.newMap<string, number>();
    for (let i = 0; i < 20; ++i) {
        map = doMut((cat) =>
            cat
                .addM("map", newMutRef(map))
                .addMWith("oldValue", ({ map }) =>
                    Hash.insert(stringHash)(`${i}`)(i)(map),
                )
                .finishM(({ map, oldValue }) => {
                    expect(oldValue).toStrictEqual(Option.none());
                    return readMutRef(map);
                }),
        );
    }
    for (let i = 0; i < 20; ++i) {
        expect(Hash.contains(stringHash)(`${i}`)(map)).toStrictEqual(true);
    }

    for (let i = 0; i < 20; ++i) {
        map = doMut((cat) =>
            cat
                .addM("map", newMutRef(map))
                .addMWith("removed", ({ map }) =>
                    Hash.remove(stringHash)(`${i}`)(map),
                )
                .finishM(({ map, removed }) => {
                    expect(removed).toStrictEqual(Option.some(i));
                    return readMutRef(map);
                }),
        );
    }
    for (let i = 0; i < 20; ++i) {
        expect(Hash.contains(stringHash)(`${i}`)(map)).toStrictEqual(false);
    }
    expect(Hash.isEmpty(map)).toStrictEqual(true);
});

test("custom hasher", () => {
    const insecureHasher = (state: bigint): Hasher => ({
        state: () => state,
        write(bytes) {
            let acc = state;
            for (const word of new Uint32Array(bytes)) {
                acc += BigInt(word);
                acc *= 0xdeadbeefn;
            }
            return insecureHasher(acc);
        },
    });

    const map = Hash.newMapWith<string, number>(insecureHasher(0n));
    expect(Hash.isEmpty(map)).toStrictEqual(true);

    const modified = doMut((cat) =>
        cat
            .addM("map", newMutRef(map))
            .addMWith("_", ({ map }) =>
                Hash.insert(stringHash)("999")(666)(map),
            )
            .finishM(({ map }) => readMutRef(map)),
    );

    expect([...Hash.entries(modified)]).toStrictEqual([["999", 666]]);
});

test("fromIterable", () => {
    const map = Hash.fromIterable(stringHash)([["xxx", 22]]);

    expect(Hash.contains(stringHash)("xxx")(map)).toStrictEqual(true);
});

test("remove", () => {
    const actual = doMut((cat) =>
        cat
            .addM("map", newMutRef(Hash.newMap<string, number>()))
            .addMWith("_", ({ map }) => Hash.insert(stringHash)("foo")(42)(map))
            .addMWith("_", ({ map }) => Hash.insert(stringHash)("foo")(42)(map))
            .addMWith("_", ({ map }) => Hash.remove(stringHash)("foo")(map))
            .finishM(({ map }) => readMutRef(map)),
    );

    expect([...Hash.keys(actual)]).toStrictEqual([]);
});

test("push and pop", () => {
    const set = Hash.newSet<string>();

    const actual1 = doMut((cat) =>
        cat
            .addM("set", newMutRef(set))
            .addMWith("didInsert", ({ set }) =>
                Hash.push(stringHash)("xx")(set),
            )
            .finishM(({ set, didInsert }) => {
                expect(didInsert).toStrictEqual(true);
                return readMutRef(set);
            }),
    );

    expect([...Hash.items(actual1)]).toStrictEqual(["xx"]);

    const actual2 = doMut((cat) =>
        cat
            .addM("set", newMutRef(set))
            .addMWith("wasPresent", ({ set }) =>
                Hash.pop(stringHash)("xx")(set),
            )
            .finishM(({ set, wasPresent }) => {
                expect(wasPresent).toStrictEqual(true);
                return readMutRef(set);
            }),
    );

    expect([...Hash.items(actual2)]).toStrictEqual([]);
});

test("union", () => {
    const left = Hash.setFromIterable(bigintHash)([6n, 6n, 1n, 2n, 1n]);
    const right = Hash.setFromIterable(bigintHash)([1n, 3n, 5n, 2n]);

    expect([...Hash.union(bigintHash)(right)(left)]).toStrictEqual([
        1n,
        5n,
        3n,
        2n,
        6n,
    ]);
});
test("difference", () => {
    const left = Hash.setFromIterable(bigintHash)([6n, 6n, 1n, 2n, 1n]);
    const right = Hash.setFromIterable(bigintHash)([1n, 3n, 5n, 2n]);

    expect([...Hash.difference(bigintHash)(right)(left)]).toStrictEqual([6n]);
    expect([...Hash.difference(bigintHash)(left)(right)]).toStrictEqual([
        5n,
        3n,
    ]);
});
test("symmetricDifference", () => {
    const left = Hash.setFromIterable(bigintHash)([6n, 6n, 1n, 2n, 1n]);
    const right = Hash.setFromIterable(bigintHash)([1n, 3n, 5n, 2n]);

    expect([
        ...Hash.symmetricDifference(bigintHash)(right)(left),
    ]).toStrictEqual([6n, 5n, 3n]);
});
test("intersection", () => {
    const left = Hash.setFromIterable(bigintHash)([6n, 6n, 1n, 2n, 1n]);
    const right = Hash.setFromIterable(bigintHash)([1n, 3n, 5n, 2n]);

    expect([...Hash.intersection(bigintHash)(right)(left)]).toStrictEqual([
        1n,
        2n,
    ]);
});

test("isDisjoint", () => {
    const a = Hash.setFromIterable(bigintHash)([1n, 2n, 3n]);

    let b = Hash.newSet<bigint>();
    expect(Hash.isDisjoint(bigintHash)(b)(a)).toStrictEqual(true);

    const push = (n: bigint, set: Hash.Set<bigint>) =>
        doMut((cat) =>
            cat
                .addM("set", newMutRef(set))
                .addMWith("_", ({ set }) => Hash.push(bigintHash)(n)(set))
                .finishM(({ set }) => readMutRef(set)),
        );
    b = push(4n, b);
    expect(Hash.isDisjoint(bigintHash)(b)(a)).toStrictEqual(true);

    b = push(1n, b);
    expect(Hash.isDisjoint(bigintHash)(b)(a)).toStrictEqual(false);
});
test("isSubset", () => {
    const a = Hash.setFromIterable(bigintHash)([1n, 2n, 3n]);

    let b = Hash.newSet<bigint>();
    expect(Hash.isSubset(bigintHash)(a)(b)).toStrictEqual(true);

    const push = (n: bigint, set: Hash.Set<bigint>) =>
        doMut((cat) =>
            cat
                .addM("set", newMutRef(set))
                .addMWith("_", ({ set }) => Hash.push(bigintHash)(n)(set))
                .finishM(({ set }) => readMutRef(set)),
        );
    b = push(1n, b);
    expect(Hash.isSubset(bigintHash)(a)(b)).toStrictEqual(true);

    b = push(4n, b);
    expect(Hash.isSubset(bigintHash)(a)(b)).toStrictEqual(false);
});
test("isSuperset", () => {
    const a = Hash.setFromIterable(bigintHash)([1n, 2n, 3n]);

    let b = Hash.newSet<bigint>();
    expect(Hash.isSuperset(bigintHash)(b)(a)).toStrictEqual(true);

    const push = (n: bigint, set: Hash.Set<bigint>) =>
        doMut((cat) =>
            cat
                .addM("set", newMutRef(set))
                .addMWith("_", ({ set }) => Hash.push(bigintHash)(n)(set))
                .finishM(({ set }) => readMutRef(set)),
        );
    b = push(1n, b);
    expect(Hash.isSuperset(bigintHash)(b)(a)).toStrictEqual(true);

    b = push(4n, b);
    expect(Hash.isSuperset(bigintHash)(b)(a)).toStrictEqual(false);
});

test("shrinkTo", () => {
    let map = Hash.newMap<string, number>();
    for (let i = 0; i < 20; ++i) {
        map = doMut((cat) =>
            cat
                .addM("map", newMutRef(map))
                .addMWith("oldValue", ({ map }) =>
                    Hash.insert(stringHash)(`${i}`)(i)(map),
                )
                .finishM(({ map, oldValue }) => {
                    expect(oldValue).toStrictEqual(Option.none());
                    return readMutRef(map);
                }),
        );
    }
    for (let i = 0; i < 20; ++i) {
        map = doMut((cat) =>
            cat
                .addM("map", newMutRef(map))
                .addMWith("removed", ({ map }) =>
                    Hash.remove(stringHash)(`${i}`)(map),
                )
                .finishM(({ map, removed }) => {
                    expect(removed).toStrictEqual(Option.some(i));
                    return readMutRef(map);
                }),
        );
    }

    map = doMut((cat) =>
        cat
            .addM("map", newMutRef(map))
            .addMWith("_", ({ map }) => Hash.shrinkToFit(map))
            .finishM(({ map }) => {
                return readMutRef(map);
            }),
    );

    expect(map.controls.length).toStrictEqual(0);
});
