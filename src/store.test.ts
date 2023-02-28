import { expect, test } from "vitest";

import { constant } from "./func.js";
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
} from "./list.js";
import { Store, experiment, extend, extract } from "./store.js";

test("store with life game", () => {
    type Coord = [number, number];
    type CellPlane<T> = Store<Coord, T>;
    type Conway = "Dead" | "Alive";
    type Area = { width: number; height: number };

    const neighborsOf = ([x, y]: Coord): List<Coord> =>
        fromArray(
            [-1, 0, 1]
                .flatMap((dx) => [-1, 0, 1].map<Coord>((dy) => [dx, dy]))
                .filter(([px, py]) => !(px == 0 && py == 0))
                .map(([dx, dy]) => [x + dx, y + dy]),
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
    const evolve = extend(step);

    const toCellPlane = (record: Conway[][]): CellPlane<Conway> => ({
        index: [0, 0],
        accessor: ([x, y]) => record?.[y]?.[x] ?? "Dead",
    });
    const fromCellPlane =
        (plane: CellPlane<Conway>) =>
        ({ width, height }: Area): Conway[][] => {
            const xs = toArray(range(0, width));
            const ys = toArray(range(0, height));
            const coords = fromArray(ys.flatMap((y) => xs.map((x): Coord => [x, y])));
            const array: Conway[][] = [];
            for (const [[x, y], cell] of toIterator(
                zip(coords)(experiment(listFunctor)<Coord>(constant(coords))(plane)),
            )) {
                if (!array[y]) {
                    array[y] = [];
                }
                array[y][x] = cell;
            }
            return array;
        };

    /*
    | O  |
    |  O |
    |OOO |
    |    |
    */
    const mapping: Conway[][] = [
        ["Dead", "Alive", "Dead", "Dead"],
        ["Dead", "Dead", "Alive", "Dead"],
        ["Alive", "Alive", "Alive", "Dead"],
        ["Dead", "Dead", "Dead", "Dead"],
    ];
    const initialPlane = toCellPlane(mapping);
    const evolved = evolve(initialPlane);
    /*
    |    |
    |O O |
    | OO |
    | O  |
    */
    const nextPlane = fromCellPlane(evolved)({ width: 4, height: 4 });
    expect(nextPlane).toEqual([
        ["Dead", "Dead", "Dead", "Dead"],
        ["Alive", "Dead", "Alive", "Dead"],
        ["Dead", "Alive", "Alive", "Dead"],
        ["Dead", "Alive", "Dead", "Dead"],
    ]);
});
