/**
 * This module provides a graph data structure, consists of nodes and edges among them.
 *
 * # Terminology
 *
 * - label
 * - node
 * - edge
 *   - directed/undirected
 *
 * @module
 * @packageDocumentation
 */

import { type CatT, doT } from "./cat.ts";
import {
    appendToHead,
    empty,
    filter,
    foldable,
    fromArray,
    length,
    type List,
    mapOption,
    monad as listMonad,
    plus,
    range,
    toIterator,
    unique,
} from "./list.ts";
import { none, type Option, some, unwrap } from "./option.ts";
import { equal, greater, less } from "./ordering.ts";
import { err, isErr, ok, type Result } from "./result.ts";
import { BinaryHeap } from "../mod.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromProjection, nonNanOrd, type Ord } from "./type-class/ord.ts";
import type { Apply2Only, Hkt1 } from "./hkt.ts";
import type { HasInf } from "./type-class/has-inf.ts";
import { doMut, type Mut, type MutHkt, type MutRef } from "./mut.ts";
import { mapMIgnore } from "./type-class/foldable.ts";
import { fromEncoder } from "./type-class/hash.ts";
import { enc, eq } from "./tuple.ts";
import { encU32Le } from "./serial.ts";

declare const vertexNominal: unique symbol;
/**
 * An index integer of vertices. It may invalid and not guaranteed that the vertex exists.
 */
export type Vertex = number & { [vertexNominal]: never };

/**
 * A directed graph as an adjacency list. It is a sparse array of adjacencies.
 */
export type Graph = readonly (List<Vertex> | undefined)[];

/**
 * A bound of indexes of vertices, used to show a range accepting for their indices.
 */
export type Bounds = readonly [start: Vertex, end: Vertex];
/**
 * A directed edge on a graph, connecting a `from` vertex and `to` vertex.
 */
export type Edge = readonly [from: Vertex, to: Vertex];

/**
 * Lookups the adjacent vertices which can visit from `from` vertex.
 *
 * @param from - Start point to lookup.
 * @param graph - Context of lookup.
 * @returns The adjacent vertices from `from`.
 */
export const adjsFrom = (from: Vertex) => (graph: Graph): List<Vertex> =>
    graph[from] ?? empty();

/**
 * Gets the existing vertices from the graph.
 *
 * @param graph - To be extracted.
 * @returns The list of vertices.
 */
export const vertices = (graph: Graph): List<Vertex> =>
    filter((v: Vertex) => v in graph)(range(0, graph.length) as List<Vertex>);

/**
 * Gets all the existing edges from the graph.
 *
 * @param graph - To be extracted.
 * @returns The list of edges.
 */
export const edges = (graph: Graph): List<Edge> =>
    doT(listMonad)
        .addM("from", vertices(graph))
        .addMWith("to", ({ from }) => adjsFrom(from)(graph))
        .finish(({ from, to }) => [from, to]);

/**
 * Gets the index bounds of the graph.
 *
 * @param graph - To be queried.
 * @returns The index bounds.
 */
export const bounds = (
    graph: Graph,
): Bounds => [0 as Vertex, graph.length - 1 as Vertex];

/**
 * Counts the outgoing degree edges by vertex.
 *
 * @param graph - To be queried.
 * @returns The numbers of outgoing degrees by vertex.
 */
export const outDegree = (graph: Graph): number[] =>
    graph.map((adj) => adj ? length(adj) : 0);

/**
 * Counts the incoming degree edges by vertex.
 *
 * @param graph - To be queried.
 * @returns The numbers of incoming degrees by vertex.
 */
export const inDegree = (graph: Graph): number[] => {
    const degrees = [...new Array(graph.length)].map(() => 0) as number[];
    for (let from = 0 as Vertex; from < graph.length; ++from) {
        for (const to of toIterator(adjsFrom(from)(graph))) {
            ++degrees[to];
        }
    }
    return degrees;
};

/**
 * Builds a new `Graph` with the total order and edges with its label.
 *
 * @param order - A total order of key type `K`.
 * @param edges
 * @returns The new graph, function to get a corresponding vertex, and function to index a vertex by a key.
 */
export const fromEdges =
    <K>(order: Ord<K>) =>
    <L>(edges: readonly [label: L, from: K, to: readonly K[]][]): {
        graph: Graph;
        getVertex: (vertex: Vertex) => [label: L, from: K, to: readonly K[]];
        indexVertex: (key: K) => Option<Vertex>;
    } => {
        const sortedEdges = edges.toSorted(([, a], [, b]) => order.cmp(a, b));
        const keyMap: K[] = sortedEdges.map(([, key]) => key);
        const indexVertex = (key: K): Option<Vertex> => {
            let start = 0;
            let end = edges.length - 1;
            while (start <= end) {
                const mid = start + Math.floor((end - start) / 2);
                switch (order.cmp(key, keyMap[mid])) {
                    case equal:
                        return some(mid as Vertex);
                    case less:
                        end = mid - 1;
                        break;
                    case greater:
                        start = mid + 1;
                }
            }
            return none();
        };
        const graph: Graph = sortedEdges.map(([, , to]) =>
            mapOption(indexVertex)(fromArray(to))
        );
        return {
            graph,
            getVertex: (vertex) => sortedEdges[vertex],
            indexVertex,
        };
    };

/**
 * Builds a new `Graph` with `edges`, limiting the indices by `bounds`.
 *
 * @param bounds - A range of indices that allowed in `edges`.
 * @param edges - A list of edges, pair of vertices having `from` and `to`.
 * @returns The new graph.
 */
export const build = ([start, end]: Bounds) => (edges: List<Edge>): Graph => {
    if (!(start <= end)) {
        throw new Error("`start` must be less than or equals to `end`");
    }
    const graph = [...new Array(end + 1)].map(() => empty()) as List<
        Vertex
    >[];
    for (const [from, to] of toIterator(edges)) {
        if (!(start <= from && from <= end)) {
            throw new Error("`from` is out of bounds");
        }
        if (!(start <= to && to <= end)) {
            throw new Error("`to` is out of bounds");
        }
        graph[from] = appendToHead(to)(graph[from]);
    }
    return graph;
};

/**
 * Gets the reversed edges on the graph.
 *
 * @param graph - A source graph.
 * @returns The reversed edges.
 */
export const reversedEdges = (graph: Graph): List<Edge> =>
    doT(listMonad)
        .addM("edge", edges(graph))
        .finish(({ edge: [from, to] }) => [to, from]);

/**
 * Creates a new graph from reversed edges on the graph.
 *
 * @param graph - A source graph.
 * @returns The reversed graph.
 */
export const toReversed = (graph: Graph): Graph =>
    build(bounds(graph))(reversedEdges(graph));
/**
 * Creates a new graph from reversed edges on the graph. An alias of `toReversed`.
 *
 * @alias toReversed
 */
export const transpose: (graph: Graph) => Graph = toReversed;

/**
 * Extracts the visited vertex indices in pre-order starting from `start`.
 *
 * @param start - An index to start traversal.
 * @param graph - To be traversed.
 * @returns The visited indices in pre-order.
 */
export const preOrder = (start: Vertex) => (graph: Graph): Vertex[] => {
    const visited = new Set<Vertex>();
    const stack = [start] as Vertex[];
    while (stack.length > 0) {
        const visiting = stack.pop()!;
        visited.add(visiting);
        for (const next of toIterator(adjsFrom(visiting)(graph))) {
            if (!visited.has(next)) {
                stack.push(next);
            }
        }
    }
    return [...visited];
};

/**
 * Extracts the visited vertex indices in post-order starting from `start`.
 *
 * @param start - An index to start traversal.
 * @param graph - To be traversed.
 * @returns The visited indices in post-order.
 */
export const postOrder = (start: Vertex) => (graph: Graph): Vertex[] => {
    const nodes = [] as Vertex[];
    const visited = new Set<Vertex>();
    const visit = (visiting: Vertex) => {
        visited.add(visiting);
        for (const next of toIterator(adjsFrom(visiting)(graph))) {
            if (!visited.has(next)) {
                visit(next);
            }
        }
        nodes.push(visiting);
    };
    visit(start);
    return nodes;
};

/**
 * An error that shows there is a cycle in the graph at the edge.
 */
export type CycleError = Readonly<{
    /**
     * The edge which causes a cycle in the graph.
     */
    at: Edge;
}>;

/**
 * Sorts the vertices of a directed acyclic graph (DAG) in the topological order. It is useful for resolving dependencies.
 *
 * @param graph - A graph to sort.
 * @returns The topological order vertices of `Ok`, or a `CycleError` on `Err` only if there is a cycle.
 */
export const topologicalSort = (graph: Graph): Result<CycleError, Vertex[]> => {
    function dfs(
        vertex: Vertex,
        graph: Graph,
        visited: boolean[],
        res: Vertex[],
    ): void {
        visited[vertex] = true;
        for (const next of toIterator(graph[vertex]!)) {
            if (!visited[next]) {
                dfs(next, graph, visited, res);
            }
        }
        res.push(vertex);
    }
    const res = [] as Vertex[];
    const visited = new Array<boolean>(graph.length).fill(false);
    for (let vertex = 0 as Vertex; vertex < graph.length; ++vertex) {
        if (vertex in graph && !visited[vertex]) {
            dfs(vertex, graph, visited, res);
        }
    }
    res.reverse();

    const posByVertex = new Map(res.map((vertex, i) => [vertex, i]));
    for (let from = 0 as Vertex; from < graph.length; ++from) {
        if (from in graph) {
            for (const to of toIterator(graph[from]!)) {
                if (
                    !((posByVertex.get(from) ?? 0) < (posByVertex.get(to) ?? 0))
                ) {
                    return err({ at: [from, to] });
                }
            }
        }
    }
    return ok(res);
};

/**
 * Checks whether the graph has a cycle.
 *
 * @param graph - To be checked,
 * @returns Whether a cycle exists.
 */
export const isCyclic = (graph: Graph): boolean =>
    isErr(topologicalSort(graph));

/**
 * Makes the graph undirected. It duplicates edges into opposite ones.
 *
 * @param graph - A source graph.
 * @returns The naive undirected graph.
 */
export const toUndirected = (graph: Graph): Graph =>
    build(bounds(graph))(
        unique<Edge>(
            fromEncoder(eq({ equalityA: nonNanOrd, equalityB: nonNanOrd }))(
                enc(encU32Le)(encU32Le),
            ),
        )(plus(edges(graph))(reversedEdges(graph))),
    );

/**
 * Decomposes the graph into connected components.
 *
 * @param graph - A source graph.
 * @returns The array of connected components on the graph.
 */
export const connectedComponents = (graph: Graph): Set<Vertex>[] => {
    const undirected = toUndirected(graph);
    /*
     * `unionFind[idx]` means:
     * - negative value of its tree size if negative,
     * - parent index if positive.
     */
    const unionFind = new Array<number>(graph.length).fill(-1);
    const repr = (idx: number): number => {
        if (unionFind[idx] < 0) {
            return idx;
        }
        const parent = repr(unionFind[idx]);
        unionFind[idx] = parent;
        return parent;
    };
    const union = (a: number, b: number) => {
        a = repr(a);
        b = repr(b);
        if (a === b) {
            return;
        }
        if (unionFind[a] > unionFind[b]) {
            [a, b] = [b, a];
        }
        const greaterRoot = unionFind[b];
        unionFind[a] += greaterRoot;
        unionFind[b] = a;
    };

    for (let start = 0 as Vertex; start < undirected.length; ++start) {
        const visited = new Set<Vertex>();
        const stack = [start];
        while (stack.length > 0) {
            const visiting = stack.pop()!;
            visited.add(visiting);
            for (const next of toIterator(adjsFrom(visiting)(undirected))) {
                if (!visited.has(next)) {
                    union(visiting, next);
                    stack.push(next);
                }
            }
        }
    }
    const components = [] as (Set<Vertex> | undefined)[];
    for (let idx = 0; idx < unionFind.length; ++idx) {
        const parentPos = repr(idx);
        if (!components[parentPos]) {
            components[parentPos] = new Set();
        }
        components[parentPos].add(idx as Vertex);
    }
    return components.filter((set) => !!set);
};

/**
 * Decomposes the graph into strongly connected components (SCC).
 *
 * @param graph - A source graph.
 * @returns The array of SCC on the graph.
 */
export const stronglyConnectedComponents = (graph: Graph): Set<Vertex>[] => {
    const deadEnds = [] as Vertex[];
    {
        const visited = new Set<Vertex>();
        const visit = (visiting: Vertex) => {
            visited.add(visiting);
            for (const next of toIterator(adjsFrom(visiting)(graph))) {
                if (!visited.has(next)) {
                    visit(next);
                }
            }
            deadEnds.push(visiting);
        };
        for (let start = 0 as Vertex; start < graph.length; ++start) {
            if (!visited.has(start)) {
                visit(start);
            }
        }
    }

    const reversed = toReversed(graph);
    const components = [] as Set<Vertex>[];
    const visited = new Set<Vertex>();
    while (deadEnds.length > 0) {
        const componentStart = deadEnds.pop()!;
        if (visited.has(componentStart)) {
            continue;
        }
        const component = new Set<Vertex>();
        const stack = [componentStart];
        while (stack.length > 0) {
            const visiting = stack.pop()!;
            visited.add(visiting);
            component.add(visiting);
            for (const next of toIterator(adjsFrom(visiting)(reversed))) {
                if (!visited.has(next)) {
                    stack.push(next);
                }
            }
        }
        components.push(component);
    }
    return components;
};

/**
 * Retrieves the reachable vertices starting from `start`.
 *
 * @param start - The start point to retrieve.
 * @param graph - A source graph.
 * @returns The indices of vertex which can reach from `start` vertex.
 */
export const reachableVertices =
    (start: Vertex) => (graph: Graph): Set<Vertex> => {
        const visited = new Set<Vertex>();
        const stack = [start];
        while (stack.length > 0) {
            const visiting = stack.pop()!;
            visited.add(visiting);
            for (const next of toIterator(adjsFrom(visiting)(graph))) {
                if (!visited.has(next)) {
                    stack.push(next);
                }
            }
        }
        return visited;
    };

/**
 * Determines whether there is a path from `start` to `goal` on the graph.
 *
 * @param start - An index of starting vertex.
 * @param goal - An index of goal vertex.
 * @param graph - A source graph.
 * @returns Whether there is a path.
 */
export const canReach =
    (start: Vertex) => (goal: Vertex) => (graph: Graph): boolean => {
        if (start === goal) {
            return true;
        }

        const visited = new Set<Vertex>();
        const stack = [start];
        while (stack.length > 0) {
            const visiting = stack.pop()!;
            visited.add(visiting);
            for (const next of toIterator(adjsFrom(visiting)(graph))) {
                if (next === goal) {
                    return true;
                }
                if (!visited.has(next)) {
                    stack.push(next);
                }
            }
        }
        return false;
    };

/**
 * Calculates the shortest distances by vertices in Dijkstra's method.
 *
 * @param monoid - The `Monoid` instance for `W`.
 * @param order - The total order for `W`.
 * @param edgeWeight - A function maps a vertex to its weight.
 * @param start - The vertex to start calculation.
 * @returns The shortest distances by vertices.
 */
export const dijkstra =
    <W>(monoid: Monoid<W>, order: HasInf<W>) =>
    (edgeWeight: (edge: Edge) => W) =>
    (start: Vertex) =>
    (graph: Graph): W[] => {
        const dist = [...new Array(graph.length)].map(() => order.infinity);
        const visited = new Set<Vertex>();
        type WeightedVertex = [Vertex, W];
        interface WeightedVertexHkt extends Hkt1 {
            readonly type: [Vertex, this["arg1"]];
        }
        doMut(<S>(cat: CatT<Apply2Only<MutHkt, S>, Record<string, never>>) =>
            cat.addM(
                "heap",
                BinaryHeap.empty(
                    fromProjection<WeightedVertexHkt>(([, weight]) => weight)(
                        order,
                    ),
                ),
            ).runWith(({ heap }) =>
                BinaryHeap.insert(
                    [start, monoid.identity] as WeightedVertex,
                )(heap)
            ).finishM(({ heap }) => {
                const body = cat
                    .addM("min", BinaryHeap.popMin(heap))
                    .finishM(({ min }) => {
                        const [visiting, visitingDist] = unwrap(min);
                        visited.add(visiting);
                        dist[visiting] = visitingDist;
                        return mapMIgnore(foldable, cat.monad)(
                            (next: Vertex) => {
                                if (visited.has(next)) {
                                    return cat.monad.pure([]);
                                }
                                const nextWeight = edgeWeight([
                                    visiting,
                                    next,
                                ]);
                                return BinaryHeap.insert([
                                    next,
                                    monoid.combine(
                                        visitingDist,
                                        nextWeight,
                                    ),
                                ] as WeightedVertex)(heap);
                            },
                        )(adjsFrom(visiting)(graph));
                    });
                const loop = (
                    heap: MutRef<S, BinaryHeap.BinaryHeap<WeightedVertex>>,
                ): Mut<S, never[]> =>
                    cat.monad.flatMap((wasEmpty) =>
                        wasEmpty
                            ? cat.monad.pure([])
                            : cat.monad.flatMap(() => loop(heap))(body)
                    )(BinaryHeap.isEmpty(heap));
                return loop(heap);
            })
        );
        return dist;
    };
