import { expect, test } from "vitest";
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
} from "./graph.js";
import { fromIterable, toArray } from "./list.js";
import { unwrap } from "./option.js";
import { err, ok } from "./result.js";
import { addMonoid } from "./type-class/monoid.js";
import { nonNanOrd } from "./type-class/ord.js";

/*
    0 --> 1
    | \   ^
    |  \  |
    V   \ |
    2 --> 3
*/
const simpleGraph = build([0 as Vertex, 3 as Vertex])(
    fromIterable([
        [0 as Vertex, 1 as Vertex],
        [0 as Vertex, 3 as Vertex],
        [0 as Vertex, 2 as Vertex],
        [2 as Vertex, 3 as Vertex],
        [3 as Vertex, 0 as Vertex],
        [3 as Vertex, 1 as Vertex],
    ]),
);

/*
    downward arrows:
        0
       / \
      1   2
     / \  |
    3   4 5
*/
const tree = build([0 as Vertex, 5 as Vertex])(
    fromIterable([
        [0 as Vertex, 1 as Vertex],
        [0 as Vertex, 2 as Vertex],
        [1 as Vertex, 3 as Vertex],
        [1 as Vertex, 4 as Vertex],
        [2 as Vertex, 5 as Vertex],
    ]),
);

test("adjsFrom", () => {
    expect(
        toArray(adjsFrom(0 as Vertex)(simpleGraph)).toSorted(),
    ).toStrictEqual([1, 2, 3]);
    expect(
        toArray(adjsFrom(1 as Vertex)(simpleGraph)).toSorted(),
    ).toStrictEqual([]);
    expect(
        toArray(adjsFrom(2 as Vertex)(simpleGraph)).toSorted(),
    ).toStrictEqual([3]);
    expect(
        toArray(adjsFrom(3 as Vertex)(simpleGraph)).toSorted(),
    ).toStrictEqual([0, 1]);
});

test("vertices", () => {
    expect(toArray(vertices(simpleGraph))).toStrictEqual([0, 1, 2, 3]);
});

test("edges", () => {
    const actual = edges(simpleGraph);
    expect(toArray(actual)).toStrictEqual([
        [0 as Vertex, 2 as Vertex],
        [0 as Vertex, 3 as Vertex],
        [0 as Vertex, 1 as Vertex],
        [2 as Vertex, 3 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [3 as Vertex, 0 as Vertex],
    ]);
});

test("bounds", () => {
    expect(bounds(simpleGraph)).toStrictEqual([0 as Vertex, 3 as Vertex]);
});

test("outDegree", () => {
    expect(outDegree(simpleGraph)).toStrictEqual([3, 0, 1, 2]);
});

test("inDegree", () => {
    expect(inDegree(simpleGraph)).toStrictEqual([1, 2, 1, 2]);
});

test("reversedEdges", () => {
    const reversed = reversedEdges(tree);
    expect(toArray(reversed)).toStrictEqual([
        [2 as Vertex, 0 as Vertex],
        [1 as Vertex, 0 as Vertex],
        [4 as Vertex, 1 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [5 as Vertex, 2 as Vertex],
    ]);
});

test("toReversed", () => {
    /*
        upward arrows:
            0
           / \
          1   2
         / \  |
        3   4 5
    */
    const reversed = toReversed(tree);
    expect(toArray(vertices(reversed))).toStrictEqual([0, 1, 2, 3, 4, 5]);
    expect(toArray(edges(reversed))).toStrictEqual([
        [1 as Vertex, 0 as Vertex],
        [2 as Vertex, 0 as Vertex],
        [3 as Vertex, 1 as Vertex],
        [4 as Vertex, 1 as Vertex],
        [5 as Vertex, 2 as Vertex],
    ]);
});

test("preOrder", () => {
    /*
            0
           / \
          1   2
         / \  |
        3   4 5
    */
    expect(preOrder(0 as Vertex)(tree)).toStrictEqual([0, 1, 3, 4, 2, 5]);
});
test("postOrder", () => {
    /*
           0
          / \
         2   1
         |  / \
         5 4   3
    */
    expect(postOrder(0 as Vertex)(tree)).toStrictEqual([5, 2, 4, 3, 1, 0]);
});

test("resolve dependencies", () => {
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
        expect(actual).toStrictEqual(
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
        expect(actual).toStrictEqual(
            err({ at: [3 as Vertex, 0 as Vertex] as Edge }),
        );
    }
});

test("isCyclic", () => {
    expect(isCyclic(simpleGraph)).toStrictEqual(true);
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
        expect(isCyclic(graph)).toStrictEqual(false);
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
        expect(isCyclic(graph)).toStrictEqual(true);
    }
});

test("toUndirected", () => {
    /*
        Expected:
        0 --- 1
        | \   |
        |  \  |
        |   \ |
        2 --- 3
     */
    const undirected = toUndirected(simpleGraph);
    expect(toArray(edges(undirected))).toStrictEqual([
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

test("weakly connected components", () => {
    const cc = connectedComponents(simpleGraph);
    expect(cc.map((component) => [...component].toSorted())).toStrictEqual([
        [0, 1, 2, 3],
    ]);
});

test("strongly connected components", () => {
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
    expect(scc.map((component) => [...component].toSorted())).toStrictEqual([
        [
            unwrap(indexVertex(0)),
            unwrap(indexVertex(1)),
            unwrap(indexVertex(2)),
        ],
        [unwrap(indexVertex(3)), unwrap(indexVertex(4))],
    ]);
});

test("reachableVertices", () => {
    expect([...reachableVertices(0 as Vertex)(tree)]).toStrictEqual([
        0, 1, 3, 4, 2, 5,
    ]);
    expect([...reachableVertices(1 as Vertex)(tree)]).toStrictEqual([1, 3, 4]);
    expect([...reachableVertices(2 as Vertex)(tree)]).toStrictEqual([2, 5]);
    expect([...reachableVertices(3 as Vertex)(tree)]).toStrictEqual([3]);
    expect([...reachableVertices(4 as Vertex)(tree)]).toStrictEqual([4]);
    expect([...reachableVertices(5 as Vertex)(tree)]).toStrictEqual([5]);
});

test("canReach", () => {
    expect(canReach(0 as Vertex)(0 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(0 as Vertex)(1 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(0 as Vertex)(2 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(0 as Vertex)(3 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(1 as Vertex)(0 as Vertex)(simpleGraph)).toStrictEqual(
        false,
    );
    expect(canReach(1 as Vertex)(1 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(1 as Vertex)(2 as Vertex)(simpleGraph)).toStrictEqual(
        false,
    );
    expect(canReach(1 as Vertex)(3 as Vertex)(simpleGraph)).toStrictEqual(
        false,
    );
    expect(canReach(2 as Vertex)(0 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(2 as Vertex)(1 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(2 as Vertex)(2 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(2 as Vertex)(3 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(3 as Vertex)(0 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(3 as Vertex)(1 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(3 as Vertex)(2 as Vertex)(simpleGraph)).toStrictEqual(true);
    expect(canReach(3 as Vertex)(3 as Vertex)(simpleGraph)).toStrictEqual(true);
});

test("dijkstra", () => {
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
    const distancesFromStart = dijkstra(
        addMonoid,
        nonNanOrd,
    )(([from, to]) => distanceMat[from]![to]!)(unwrap(indexVertex(0)))(graph);
    expect(distancesFromStart).toStrictEqual([0, 5, 1, 3, 4]);
});
