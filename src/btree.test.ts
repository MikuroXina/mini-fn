import { expect, test } from "vitest";
import { Option } from "../mod.js";
import { ord as bigintOrd } from "./big-int.js";
import * as BTree from "./btree.js";
import { cat } from "./cat.js";
import { fromToInclusive } from "./range.js";
import { ord as stringOrd } from "./string.js";

test("movie review example", () => {
    const ord = stringOrd;
    const add = BTree.insert(ord);
    const [movieReviews] = cat(BTree.newMap<string, string>())
        .feed(add("Office Space")("Deals with real issues in the workplace."))
        .feed(([tree]) => add("Pulp Fiction")("Masterpiece.")(tree))
        .feed(([tree]) => add("The Godfather")("Very enjoyable.")(tree))
        .feed(([tree]) =>
            add("The Blues Brothers")("Eye lyked it a lot.")(tree),
        ).value;

    expect(BTree.containsKey(ord)("Office Space")(movieReviews)).toStrictEqual(
        true,
    );
    expect(
        BTree.containsKey(ord)("The Blues Brothers")(movieReviews),
    ).toStrictEqual(true);
    expect(
        BTree.containsKey(ord)("Les Misérables")(movieReviews),
    ).toStrictEqual(false);

    const [movieReviews2, removed] =
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
    const [map] = cat(BTree.newMap<bigint, string>())
        .feed(add(3n)("a"))
        .feed(([tree]) => add(5n)("b")(tree))
        .feed(([tree]) => add(8n)("c")(tree))
        .feed(([tree]) => add(9n)("d")(tree)).value;

    const actual = [...BTree.range(ord)(fromToInclusive(4n, 8n))(map)];

    expect(actual).toStrictEqual([
        [5n, "b"],
        [8n, "c"],
    ]);
});
