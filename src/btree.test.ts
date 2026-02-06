import { expect, test } from "vitest";
import * as BTree from "./btree.js";
import { cat } from "./cat.js";
import { ord } from "./string.js";

test("movie review example", () => {
    const add = BTree.insert(ord);
    const [movieReviews] = cat(BTree.newMap<string, string>())
        .feed(add("Office Space")("Deals with real issues in the workplace."))
        .feed(([tree]) => add("Pulp Fiction")("Masterpiece.")(tree))
        .feed(([tree]) => add("The Godfather")("Very enjoyable.")(tree))
        .feed(([tree]) =>
            add("The Blues Brothers")("Eye lyked it a lot.")(tree),
        ).value;

    console.dir(movieReviews);

    expect(BTree.containsKey(ord)("Office Space")(movieReviews)).toStrictEqual(
        true,
    );
    expect(
        BTree.containsKey(ord)("Les Misérables")(movieReviews),
    ).toStrictEqual(false);
});
