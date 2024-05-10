import { dijkstra, fromEdges } from "./graph.ts";
import { nonNanOrd } from "./type-class/ord.ts";
import { assertEquals } from "../deps.ts";
import { unwrap } from "./option.ts";
import { addMonoid } from "./type-class/monoid.ts";

Deno.test("dijkstra", () => {
    const { graph, indexVertex } = fromEdges(nonNanOrd)([
        ["0", 0, [1, 2, 3]],
        ["1", 1, [0, 2]],
        ["2", 2, [0, 1]],
        ["3", 3, [0, 4]],
        ["4", 4, [3]],
    ]);
    const distanceMat = [
        [Infinity, 5, 1, 3, Infinity],
        [5, Infinity, 2, Infinity, Infinity],
        [1, 2, Infinity, Infinity, Infinity],
        [3, Infinity, Infinity, Infinity, 1],
        [Infinity, Infinity, Infinity, Infinity, 1],
    ];
    const distancesFromStart = dijkstra(addMonoid, nonNanOrd)((
        [from, to],
    ) => distanceMat[from][to])(unwrap(indexVertex(0)))(graph);
    assertEquals(distancesFromStart, [0, 5, 1, 3, 4]);
});
