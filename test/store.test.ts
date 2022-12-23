import {
    List,
    filter,
    fromArray,
    length,
    functor as listFunctor,
    range,
    toArray,
    toIterator,
    zip,
} from "../src/list.js";
import { Store, comonad, experiment, extract } from "../src/store.js";
import { expect, test } from "vitest";

import { constant } from "../src/func.js";
import { extend } from "../src/type-class/comonad.js";

test("store with life game", () => {
    type Coord = [number, number];
    type CellPlane<T> = Store<Coord, T>;
    type Conway = "Dead" | "Alive";
    type Area = { width: number; height: number };

    const neighborsOf = ([x, y]: Coord): List<Coord> =>
        fromArray(
            [-1, 0, 1]
                .flatMap((dx) => [-1, 0, 1].flatMap<Coord>((dy) => [x + dx, y + dy]))
                .filter(([px, py]) => !(px == 0 && py == 0)),
        );
    const neighborCells: (plane: CellPlane<Conway>) => List<Conway> =
        experiment(listFunctor)(neighborsOf);
    const step = (plane: CellPlane<Conway>): Conway => {
        const cell = extract(plane);
        const neighborCount = length(filter((c: Conway) => c == "Alive")(neighborCells(plane)));
        if (cell == "Dead" && neighborCount == 3) {
            return "Alive";
        }
        if (cell == "Alive" && (neighborCount == 2 || neighborCount == 3)) {
            return "Alive";
        }
        return "Dead";
    };
    const evolve = extend(comonad)(step);

    const toCellPlane = (record: Map<Coord, Conway>): CellPlane<Conway> => ({
        index: [0, 0],
        accessor: (index) => record.get(index) ?? "Dead",
    });
    const fromCellPlane =
        (plane: CellPlane<Conway>) =>
        ({ width, height }: Area): Map<Coord, Conway> => {
            const xs = toArray(range(0, width));
            const ys = toArray(range(0, height));
            const coords = fromArray(ys.flatMap((y) => xs.map((x): Coord => [x, y])));
            return new Map(
                toIterator(zip(coords)(experiment(listFunctor)<Coord>(constant(coords))(plane))),
            );
        };

    /*
    | O  |
    |  O |
    |OOO |
    |    |
    */
    const mapping = new Map<Coord, Conway>();
    mapping.set([1, 0], "Alive");
    mapping.set([2, 1], "Alive");
    mapping.set([0, 2], "Alive");
    mapping.set([1, 2], "Alive");
    mapping.set([2, 2], "Alive");
    const initialPlane = toCellPlane(mapping);
    const evolved = evolve(initialPlane);
    /*
    |    |
    |O O |
    | OO |
    | O  |
    */
    const nextPlane = fromCellPlane(evolved)({ width: 4, height: 4 });
    expect(nextPlane.get([0, 1])).toEqual(true);
    expect(nextPlane.get([2, 1])).toEqual(true);
    expect(nextPlane.get([1, 2])).toEqual(true);
    expect(nextPlane.get([2, 2])).toEqual(true);
    expect(nextPlane.get([1, 3])).toEqual(true);
});
