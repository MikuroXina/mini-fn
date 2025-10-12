import {
    adjsFrom,
    bounds,
    build,
    canReach,
    connectedComponents,
    dijkstra,
    type Edge,
    edges,
    fromEdges,
    inDegree,
    isCyclic,
    outDegree,
    postOrder,
    preOrder,
    reachableVertices,
    reversedEdges,
    stronglyConnectedComponents,
    topologicalSort,
    toReversed,
    toUndirected,
    type Vertex,
    vertices,
} from "./graph.ts";
import { nonNanOrd } from "./type-class/ord.ts";
import { assertEquals } from "../deps.ts";
import { unwrap } from "./option.ts";
import { addMonoid } from "./type-class/monoid.ts";
import { fromIterable, toArray } from "./list.ts";
import { err, ok } from "./result.ts";

/*
    0 --> 1
    | \   ^
    |  \  |
    V   \ |
    2 --> 3
*/
const simpleGraph = build([0 as Vertex, 3 as Vertex])(fromIterable([
    [0 as Vertex, 1 as Vertex],
    [0 as Vertex, 3 as Vertex],
    [0 as Vertex, 2 as Vertex],
    [2 as Vertex, 3 as Vertex],
    [3 as Vertex, 0 as Vertex],
    [3 as Vertex, 1 as Vertex],
]));

/*
    downward arrows:
        0
       / \
      1   2
     / \  |
    3   4 5
*/
const tree = build([0 as Vertex, 5 as Vertex])(fromIterable([
    [0 as Vertex, 1 as Vertex],
    [0 as Vertex, 2 as Vertex],
    [1 as Vertex, 3 as Vertex],
    [1 as Vertex, 4 as Vertex],
    [2 as Vertex, 5 as Vertex],
]));

Deno.test("adjsFrom", () => {
    assertEquals(toArray(adjsFrom(0 as Vertex)(simpleGraph)).toSorted(), [
        1,
        2,
        3,
    ]);
    assertEquals(toArray(adjsFrom(1 as Vertex)(simpleGraph)).toSorted(), []);
    assertEquals(toArray(adjsFrom(2 as Vertex)(simpleGraph)).toSorted(), [3]);
    assertEquals(toArray(adjsFrom(3 as Vertex)(simpleGraph)).toSorted(), [
        0,
        1,
    ]);
});

Deno.test("vertices", () => {
    assertEquals(toArray(vertices(simpleGraph)), [0, 1, 2, 3]);
});

Deno.test("edges", () => {
    const actual = edges(simpleGraph);
    assertEquals(toArray(actual), [
        [0 as Vertex, 2 as Vertex],
        [0 as Vertex, 3 as Vertex],
        [0 as Vertex, 1 as Vertex],
        [2 as Vertex, 3 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [3 as Vertex, 0 as Vertex],
    ]);
});

Deno.test("bounds", () => {
    assertEquals(bounds(simpleGraph), [0 as Vertex, 3 as Vertex]);
});

Deno.test("outDegree", () => {
    assertEquals(outDegree(simpleGraph), [3, 0, 1, 2]);
});

Deno.test("inDegree", () => {
    assertEquals(inDegree(simpleGraph), [1, 2, 1, 2]);
});

Deno.test("reversedEdges", () => {
    const reversed = reversedEdges(tree);
    assertEquals(toArray(reversed), [
        [2 as Vertex, 0 as Vertex],
        [1 as Vertex, 0 as Vertex],
        [4 as Vertex, 1 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [5 as Vertex, 2 as Vertex],
    ]);
});

Deno.test("toReversed", () => {
    /*
        upward arrows:
            0
           / \
          1   2
         / \  |
        3   4 5
    */
    const reversed = toReversed(tree);
    assertEquals(toArray(vertices(reversed)), [0, 1, 2, 3, 4, 5]);
    assertEquals(toArray(edges(reversed)), [
        [1 as Vertex, 0 as Vertex],
        [2 as Vertex, 0 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [4 as Vertex, 1 as Vertex],
        [5 as Vertex, 2 as Vertex],
    ]);
});

Deno.test("preOrder", () => {
    /*
            0
           / \
          1   2
         / \  |
        3   4 5
    */
    assertEquals(preOrder(0 as Vertex)(tree), [0, 1, 3, 4, 2, 5]);
});
Deno.test("postOrder", () => {
    /*
           0
          / \
         2   1
         |  / \
         5 4   3
    */
    assertEquals(postOrder(0 as Vertex)(tree), [5, 2, 4, 3, 1, 0]);
});

Deno.test("resolve dependencies", () => {
    {
        /*
            0 --------> 3
            | \         |
            |  \        |
            V   V       V
            1 --> 2 --> 4
        */
        const { graph } = fromEdges(nonNanOrd)([
            ["0", 0, [1, 2, 3]],
            ["1", 1, [2]],
            ["2", 2, [4]],
            ["3", 3, [4]],
            ["4", 4, []],
        ]);
        const actual = topologicalSort(graph);
        assertEquals(
            actual,
            ok([
                0 as Vertex,
                3 as Vertex,
                1 as Vertex,
                2 as Vertex,
                4 as Vertex,
            ]),
        );
    }
    {
        /*
            0 <-------- 3
            | \         ^
            |  \        |
            V   V       |
            1 --> 2 --> 4
        */
        const { graph } = fromEdges(nonNanOrd)([
            ["0", 0, [1, 2]],
            ["1", 1, [2]],
            ["2", 2, [4]],
            ["3", 3, [0]],
            ["4", 4, [3]],
        ]);
        const actual = topologicalSort(graph);
        assertEquals(
            actual,
            err({ at: [3 as Vertex, 0 as Vertex] as Edge }),
        );
    }
});

Deno.test("isCyclic", () => {
    assertEquals(isCyclic(simpleGraph), true);
    {
        /*
            0 --------> 3
            | \         |
            |  \        |
            V   V       V
            1 --> 2 --> 4
        */
        const { graph } = fromEdges(nonNanOrd)([
            ["0", 0, [1, 2, 3]],
            ["1", 1, [2]],
            ["2", 2, [4]],
            ["3", 3, [4]],
            ["4", 4, []],
        ]);
        assertEquals(isCyclic(graph), false);
    }
    {
        /*
            0 <-------- 3
            | \         ^
            |  \        |
            V   V       |
            1 --> 2 --> 4
        */
        const { graph } = fromEdges(nonNanOrd)([
            ["0", 0, [1, 2]],
            ["1", 1, [2]],
            ["2", 2, [4]],
            ["3", 3, [0]],
            ["4", 4, [3]],
        ]);
        assertEquals(isCyclic(graph), true);
    }
});

Deno.test("toUndirected", () => {
    /*
        Expected:
        0 --- 1
        | \   |
        |  \  |
        |   \ |
        2 --- 3
     */
    const undirected = toUndirected(simpleGraph);
    assertEquals(toArray(edges(undirected)), [
        [0 as Vertex, 1 as Vertex],
        [0 as Vertex, 3 as Vertex],
        [0 as Vertex, 2 as Vertex],
        [1 as Vertex, 3 as Vertex],
        [1 as Vertex, 0 as Vertex],
        [2 as Vertex, 0 as Vertex],
        [2 as Vertex, 3 as Vertex],
        [3 as Vertex, 2 as Vertex],
        [3 as Vertex, 0 as Vertex],
        [3 as Vertex, 1 as Vertex],
    ]);
});

Deno.test("weakly connected components", () => {
    const cc = connectedComponents(simpleGraph);
    assertEquals(cc.map((component) => [...component].toSorted()), [[
        0,
        1,
        2,
        3,
    ]]);
});

Deno.test("strongly connected components", () => {
    /*
        0 --------> 3
        | ^         ^
        |  \        |
        V   \       V
        1 --> 2 --> 4
    */
    const { graph, indexVertex } = fromEdges(nonNanOrd)([
        ["0", 0, [1, 3]],
        ["1", 1, [2]],
        ["2", 2, [0, 4]],
        ["3", 3, [4]],
        ["4", 4, [3]],
    ]);
    const scc = stronglyConnectedComponents(graph);
    assertEquals(scc.map((component) => [...component].toSorted()), [
        [
            unwrap(indexVertex(0)),
            unwrap(indexVertex(1)),
            unwrap(indexVertex(2)),
        ],
        [
            unwrap(indexVertex(3)),
            unwrap(indexVertex(4)),
        ],
    ]);
});

Deno.test("reachableVertices", () => {
    assertEquals([...reachableVertices(0 as Vertex)(tree)], [0, 1, 3, 4, 2, 5]);
    assertEquals([...reachableVertices(1 as Vertex)(tree)], [1, 3, 4]);
    assertEquals([...reachableVertices(2 as Vertex)(tree)], [2, 5]);
    assertEquals([...reachableVertices(3 as Vertex)(tree)], [3]);
    assertEquals([...reachableVertices(4 as Vertex)(tree)], [4]);
    assertEquals([...reachableVertices(5 as Vertex)(tree)], [5]);
});

Deno.test("canReach", () => {
    assertEquals(canReach(0 as Vertex)(0 as Vertex)(simpleGraph), true);
    assertEquals(canReach(0 as Vertex)(1 as Vertex)(simpleGraph), true);
    assertEquals(canReach(0 as Vertex)(2 as Vertex)(simpleGraph), true);
    assertEquals(canReach(0 as Vertex)(3 as Vertex)(simpleGraph), true);
    assertEquals(canReach(1 as Vertex)(0 as Vertex)(simpleGraph), false);
    assertEquals(canReach(1 as Vertex)(1 as Vertex)(simpleGraph), true);
    assertEquals(canReach(1 as Vertex)(2 as Vertex)(simpleGraph), false);
    assertEquals(canReach(1 as Vertex)(3 as Vertex)(simpleGraph), false);
    assertEquals(canReach(2 as Vertex)(0 as Vertex)(simpleGraph), true);
    assertEquals(canReach(2 as Vertex)(1 as Vertex)(simpleGraph), true);
    assertEquals(canReach(2 as Vertex)(2 as Vertex)(simpleGraph), true);
    assertEquals(canReach(2 as Vertex)(3 as Vertex)(simpleGraph), true);
    assertEquals(canReach(3 as Vertex)(0 as Vertex)(simpleGraph), true);
    assertEquals(canReach(3 as Vertex)(1 as Vertex)(simpleGraph), true);
    assertEquals(canReach(3 as Vertex)(2 as Vertex)(simpleGraph), true);
    assertEquals(canReach(3 as Vertex)(3 as Vertex)(simpleGraph), true);
});

Deno.test("dijkstra", () => {
    /*
        0 <-------> 3
        ^ ^         ^
        |  \        |
        V   V       V
        1 <-> 2 --> 4
    */
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
    ) => distanceMat[from]![to]!)(unwrap(indexVertex(0)))(graph);
    assertEquals(distancesFromStart, [0, 5, 1, 3, 4]);
});
