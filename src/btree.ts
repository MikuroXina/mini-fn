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

/** node split anchor */
const B = 6;
/** entries max */
const CAPACITY = (2 * B - 1) as 11;

interface Node<T> {
    /**
     * Inserted comparable entries padded to the left. It has at most `CAPACITY` items.
     */
    entries: T[];
    /**
     * Children nodes padded to the left. It has `entries.length + 1` items.
     */
    edges: Tree<T>[];
}

type Tree<T> = Option.Option<Node<T>>;

const empty: <T>() => Tree<T> = Option.none;
const branch: <T>(node: Node<T>) => Tree<T> = Option.some;
const splitFull = <T>(
    node: Node<T>,
): [left: Node<T>, center: T, right: Node<T>] => {
    if (node.entries.length < CAPACITY) {
        throw new Error("expected node with full entries");
    }

    const entriesLeft = node.entries.slice(0, B);
    const edgesLeft = node.edges.slice(0, 6);

    const entriesCenter = node.entries[B]!;

    const entriesRight = node.entries.slice(B + 1);
    const edgesRight = node.edges.slice(6);

    return [
        {
            entries: entriesLeft,
            edges: edgesLeft,
        },
        entriesCenter,
        {
            entries: entriesRight,
            edges: edgesRight,
        },
    ];
};

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
    if (Option.isNone(tree)) {
        return;
    }
    function* nodeToIterator(node: Node<T>): Iterable<T> {
        for (let i = 0; i < node.entries.length; ++i) {
            const next = node.edges[i]!;
            if (Option.isNone(next)) {
                return;
            }
            yield* nodeToIterator(Option.unwrap(next));
            yield node.entries[i]!;
        }
        const next = node.edges[node.entries.length]!;
        if (Option.isNone(next)) {
            return;
        }
        yield* nodeToIterator(Option.unwrap(next));
    }
    yield* nodeToIterator(Option.unwrap(tree));
}

export const has =
    <T>(ord: Ord<T>) =>
    (needle: T) =>
    (tree: BTreeSet<T>): boolean => {
        if (Option.isNone(tree)) {
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
        if (Option.isNone(tree)) {
            return [tree, Option.none()];
        }

        function insertInternal<X>(
            target: Node<T>,
            onOverflow: (left: Node<T>, center: T, right: Node<T>) => X,
            onFit: (node: Node<T>, old: Option.Option<T>) => X,
        ): X {
            for (let i = 0; i < target.entries.length; ++i) {
                switch (ord.cmp(item, target.entries[i]!)) {
                    case less:
                        if (Option.isSome(target.edges[i]!)) {
                            return insertInternal(
                                Option.unwrap(target.edges[i]!),
                                (left, center, right) => {
                                    const newNode = {
                                        entries: target.entries.toSpliced(
                                            i,
                                            0,
                                            center,
                                        ),
                                        edges: target.edges.toSpliced(
                                            i,
                                            1,
                                            branch(left),
                                            branch(right),
                                        ),
                                    };
                                    if (newNode.entries.length >= CAPACITY) {
                                        return onOverflow(
                                            ...splitFull(newNode),
                                        );
                                    }
                                    return onFit(newNode, Option.none());
                                },
                                (node, old) => {
                                    const newNode = {
                                        ...target,
                                        edges: target.edges.toSpliced(
                                            i,
                                            1,
                                            branch(node),
                                        ),
                                    };
                                    return onFit(newNode, old);
                                },
                            );
                        }
                        return onFit(
                            {
                                ...target,
                                edges: target.edges.toSpliced(
                                    i,
                                    1,
                                    branch({
                                        entries: [item],
                                        edges: [],
                                    }),
                                ),
                            },
                            Option.none(),
                        );
                    case equal:
                        return onFit(
                            {
                                ...target,
                                entries: target.entries.toSpliced(i, 1, item),
                            },
                            Option.some(target.entries[i]!),
                        );
                    case greater:
                        break;
                }
            }
            if (Option.isSome(target.edges[target.entries.length]!)) {
                return insertInternal(
                    Option.unwrap(target.edges[target.entries.length]!),
                    (left, center, right) => {
                        const newNode = {
                            entries: target.entries.toSpliced(
                                target.entries.length,
                                0,
                                center,
                            ),
                            edges: target.edges.toSpliced(
                                target.entries.length + 1,
                                1,
                                branch(left),
                                branch(right),
                            ),
                        };
                        if (newNode.entries.length >= CAPACITY) {
                            return onOverflow(...splitFull(newNode));
                        }
                        return onFit(newNode, Option.none());
                    },
                    (node, old) => {
                        const newNode = {
                            ...target,
                            edges: target.edges.toSpliced(
                                target.entries.length,
                                1,
                                branch(node),
                            ),
                        };
                        return onFit(newNode, old);
                    },
                );
            }
            return onFit(
                {
                    ...target,
                    edges: target.edges.toSpliced(
                        target.entries.length,
                        1,
                        branch({
                            entries: [item],
                            edges: [],
                        }),
                    ),
                },
                Option.none(),
            );
        }
        return insertInternal(
            Option.unwrap(tree),
            (left, center, right) => [
                branch({
                    entries: [center],
                    edges: [branch(left), branch(right)],
                }),
                Option.none(),
            ],
            (node, old) => [branch(node), old],
        );
    };
