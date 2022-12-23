import { Zipper2, comonad, extract, top } from "../src/zipper/zipper2.js";
import { expect, test } from "vitest";
import { fromArray, toArray } from "../src/list.js";
import { fromList, toList } from "../src/zipper.js";
import { unwrap, unwrapOr } from "../src/option.js";

import { extend } from "../src/type-class/comonad.js";

test("zipper with life game", () => {
    const countNeighbors = (z: Zipper2<boolean>): number => {
        const [up, [left, , right], down] = top(z);
        return [...up, left, right, ...down].map(unwrapOr(false)).filter((cell) => cell).length;
    };
    const hasLife = (z: Zipper2<boolean>): boolean => {
        const here = extract(z);
        const neighbors = countNeighbors(z);
        console.log(z, neighbors);
        return (here && (neighbors === 2 || neighbors === 3)) || (!here && neighbors === 3);
    };
    const nextStep = extend(comonad)(hasLife);

    const initialState = unwrap(
        fromList(
            fromArray([
                unwrap(fromList(fromArray([false, true, false, false, false]))),
                unwrap(fromList(fromArray([false, false, true, false, false]))),
                unwrap(fromList(fromArray([true, true, true, false, false]))),
                unwrap(fromList(fromArray([false, false, false, false, false]))),
                unwrap(fromList(fromArray([false, false, false, false, false]))),
            ]),
        ),
    );
    /*
    | O     |    |       |
    |  O    |    |O O    |
    |OOO    | -> | OO    |
    |       |    | O     |
    |       |    |       |
    */
    const nextState = nextStep(initialState);
    const expected = [
        [false, false, false, false, false],
        [true, false, true, false, false],
        [false, true, true, false, false],
        [false, true, false, false, false],
        [false, false, false, false, false],
    ];
    expect(toArray(toList(nextState)).map((row) => toArray(toList(row)))).toEqual(expected);
});
