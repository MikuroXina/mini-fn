/**
 * This module provides
 *
 * @packageDocumentation
 * @module
 */
/*
A B-tree (this custom) must keep the following invariants:

1. Every node has at most 12 children.
2. Internal node has at least 6 children.
3. Root node has at least two children unless it is a leaf.
4. Leaf node appears on the same depth.
5. A non-leaf node with `k` keys contains `k + 1` children.
6. An i-th key is less than all sub-keys in i-th children.
 */

import { Option } from "../mod.js";
import { equal, greater, less } from "./ordering.js";
import type { Ord } from "./type-class/ord.js";

const B = 6;
const CAPACITY = (2 * B - 1) as 11;
const EDGES = (2 * B) as 12;

interface Node<T> {
    /**
     * Height from the root.
     */
    height: number;
    /**
     * Inserted comparable entries padded to the left. It has at most `CAPACITY` items.
     */
    entries: T[];
    /**
     * Children nodes padded to the left. It has `entries.length + 1` items.
     */
    edges: Tree<T>[];
}

const leafNominal = Symbol("TreeLeaf");
type Leaf = [typeof leafNominal];
const branchNominal = Symbol("TreeBranch");
type Branch<T> = [typeof branchNominal, Node<T>];
type Tree<T> = Leaf | Branch<T>;

const isLeaf = <T>(tree: Tree<T>): tree is Leaf => tree[0] === leafNominal;

const empty = <T>(): Tree<T> => [leafNominal];
const branch = <T>(node: Node<T>): Tree<T> => [branchNominal, node];

const single = <T>(item: T): Tree<T> => [
    branchNominal,
    {
        height: 0,
        entries: [item],
        edges: [empty(), empty()],
    },
];

/**
 * Stores the unique values `T` which is expected to implement `Ord` type class.
 */
export type BTreeSet<T> = Tree<T>;

/**
 * Creates a new `BTreeSet<T>`.
 *
 * @returns The new empty collection.
 */
export const newMap: <T>() => BTreeSet<T> = empty;

export function* toIterator<T>(tree: BTreeSet<T>): Iterator<T> {
    if (isLeaf(tree)) {
        return;
    }
    function* branchToIterator([, node]: Branch<T>): Iterable<T> {
        for (let i = 0; i < node.entries.length; ++i) {
            const next = node.edges[i];
            if (next == null || isLeaf(next)) {
                return;
            }
            yield* branchToIterator(next);
            yield node.entries[i]!;
        }
        const next = node.edges[node.entries.length];
        if (next == null || isLeaf(next)) {
            return;
        }
        yield* branchToIterator(next);
    }
    yield* branchToIterator(tree);
}

export const has =
    <T>(ord: Ord<T>) =>
    (needle: T) =>
    (tree: BTreeSet<T>): boolean => {
        if (isLeaf(tree)) {
            return false;
        }
        const node = tree[1];
        for (let i = 0; i < node.entries.length; ++i) {
            switch (ord.cmp(needle, node.entries[i]!)) {
                case less:
                    return has(ord)(needle)(node.edges[i]!);
                case equal:
                    return true;
                case greater:
                    break;
            }
        }
        return has(ord)(needle)(node.edges[node.entries.length]!);
    };

export const insert =
    <T>(ord: Ord<T>) =>
    (item: T) =>
    (tree: BTreeSet<T>): [tree: BTreeSet<T>, old: Option.Option<T>] => {
        if (isLeaf(tree)) {
            return [single(item), Option.none()];
        }

        const node = tree[1];
        if (node.entries.length < CAPACITY) {
            for (let i = 0; i < node.entries.length; ++i) {
                const entry = node.entries[i]!;
                switch (ord.cmp(item, entry)) {
                    case less:
                        return [
                            branch({
                                ...node,
                                entries: node.entries.toSpliced(i, 0, item),
                                edges: node.edges.toSpliced(i + 1, 0, empty()),
                            }),
                            Option.some(entry),
                        ];
                    case equal:
                        return [
                            branch({
                                ...node,
                                entries: node.entries.with(i, item),
                            }),
                            Option.some(entry),
                        ];
                    case greater:
                        break;
                }
            }
            return [
                branch({
                    ...node,
                    entries: node.entries.toSpliced(
                        node.entries.length,
                        0,
                        item,
                    ),
                    edges: node.edges.toSpliced(
                        node.entries.length,
                        0,
                        empty(),
                    ),
                }),
                Option.none(),
            ];
        }
    };
