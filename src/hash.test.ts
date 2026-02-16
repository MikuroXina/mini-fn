import { expect, test } from "vitest";
import * as Hash from "./hash.js";
import { doMut, newMutRef, readMutRef } from "./mut.js";
import { hash as stringHash, ord as stringOrd } from "./string.js";

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

    expect(
        [...Hash.entries(actual)].toSorted(([a], [b]) => stringOrd.cmp(a, b)),
    ).toStrictEqual([
        ["Adventures of Huckleberry Finn", "My favorite book."],
        ["Grimms' Fairy Tales", "Masterpiece."],
        ["Pride and Prejudice", "Very enjoyable."],
        ["The Adventures of Sherlock Holmes", "Eye lyked it alot."],
    ]);
});

test("fromIterable", () => {
    const map = Hash.fromIterable(stringHash)([["xxx", 22]]);

    expect(Hash.contains(stringHash)("xxx")(map)).toStrictEqual(true);
});
