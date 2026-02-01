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

interface Node<K, V> {
    /**
     * Inserted comparable keys padded to the left. It has at most `CAPACITY` items.
     */
    keys: K[];
    /**
     * Inserted values associated to `keys`. It has at most `CAPACITY` items.
     */
    values: V[];
    /**
     * Children nodes padded to the left. It has `entries.length + 1` items.
     */
    edges: Tree<K, V>[];
}

type Tree<K, V> = Option.Option<Node<K, V>>;

//
// Core methods
//

const empty: <K, V>() => Tree<K, V> = Option.none;
const branch: <K, V>(node: Node<K, V>) => Tree<K, V> = Option.some;
const splitFull = <K, V>(
    node: Node<K, V>,
): [left: Node<K, V>, center: [K, V], right: Node<K, V>] => {
    if (node.keys.length < CAPACITY) {
        throw new Error("expected node with full entries");
    }

    const keysLeft = node.keys.slice(0, B);
    const valuesLeft = node.values.slice(0, B);
    const edgesLeft = node.edges.slice(0, 6);

    const keyCenter = node.keys[B]!;
    const valueCenter = node.values[B]!;

    const keysRight = node.keys.slice(B + 1);
    const valuesRight = node.values.slice(B + 1);
    const edgesRight = node.edges.slice(6);

    return [
        {
            keys: keysLeft,
            values: valuesLeft,
            edges: edgesLeft,
        },
        [keyCenter, valueCenter],
        {
            keys: keysRight,
            values: valuesRight,
            edges: edgesRight,
        },
    ];
};

//
// BTreeMap methods
//

/**
 * Stores the values `V` associated to the keys `K` which is expected to implement `Ord` type class.
 */
export type BTreeMap<K, V> = Tree<K, V>;

/**
 * Creates a new `BTreeMap<K, V>`.
 *
 * @returns The new empty collection.
 */
export const newMap: <K, V>() => BTreeMap<K, V> = empty;

/**
 * Inserts `item` to `map`. It takes `O(log N)`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Specifying the entry.
 * @param value - To be inserted.
 * @param map - Insertion target.
 * @returns Tuple of inserted set and replaced old value if `key` was a duplicated entry.
 */
export const insert =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(value: V) =>
    (map: BTreeMap<K, V>): [tree: BTreeMap<K, V>, old: Option.Option<V>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }

        function insertInternal<X>(
            target: Node<K, V>,
            onOverflow: (
                left: Node<K, V>,
                center: [K, V],
                right: Node<K, V>,
            ) => X,
            onFit: (node: Node<K, V>, old: Option.Option<V>) => X,
        ): X {
            for (let i = 0; i < target.keys.length; ++i) {
                switch (ord.cmp(key, target.keys[i]!)) {
                    case less:
                        if (Option.isSome(target.edges[i]!)) {
                            return insertInternal(
                                Option.unwrap(target.edges[i]!),
                                (left, [centerK, centerV], right) => {
                                    const newNode = {
                                        keys: target.keys.toSpliced(
                                            i,
                                            0,
                                            centerK,
                                        ),
                                        values: target.values.toSpliced(
                                            i,
                                            0,
                                            centerV,
                                        ),
                                        edges: target.edges.toSpliced(
                                            i,
                                            1,
                                            branch(left),
                                            branch(right),
                                        ),
                                    };
                                    if (newNode.keys.length >= CAPACITY) {
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
                                        keys: [key],
                                        values: [value],
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
                                keys: target.keys.toSpliced(i, 1, key),
                                values: target.values.toSpliced(i, 1, value),
                            },
                            Option.some(target.values[i]!),
                        );
                    case greater:
                        break;
                }
            }
            if (Option.isSome(target.edges[target.keys.length]!)) {
                return insertInternal(
                    Option.unwrap(target.edges[target.keys.length]!),
                    (left, [centerK, centerV], right) => {
                        const newNode = {
                            keys: target.keys.toSpliced(
                                target.keys.length,
                                0,
                                centerK,
                            ),
                            values: target.values.toSpliced(
                                target.keys.length,
                                0,
                                centerV,
                            ),
                            edges: target.edges.toSpliced(
                                target.keys.length + 1,
                                1,
                                branch(left),
                                branch(right),
                            ),
                        };
                        if (newNode.keys.length >= CAPACITY) {
                            return onOverflow(...splitFull(newNode));
                        }
                        return onFit(newNode, Option.none());
                    },
                    (node, old) => {
                        const newNode = {
                            ...target,
                            edges: target.edges.toSpliced(
                                target.keys.length,
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
                        target.keys.length,
                        1,
                        branch({
                            keys: [key],
                            values: [value],
                            edges: [],
                        }),
                    ),
                },
                Option.none(),
            );
        }
        return insertInternal(
            Option.unwrap(map),
            (left, [centerK, centerV], right) => [
                branch({
                    keys: [centerK],
                    values: [centerV],
                    edges: [branch(left), branch(right)],
                }),
                Option.none(),
            ],
            (node, old) => [branch(node), old],
        );
    };

//
// BTreeSet methods
//

/**
 * Stores the unique values `T` which is expected to implement `Ord` type class.
 */
export type BTreeSet<T> = Tree<T, never[]>;

/**
 * Creates a new `BTreeSet<T>`.
 *
 * @returns The new empty collection.
 */
export const newSet: <T>() => BTreeSet<T> = empty;

/**
 * Converts the set into an iterator traversing contained items.
 *
 * @param set - To be traversed.
 * @returns The iterator of contained items.
 */
export function* setToIterator<T>(set: BTreeSet<T>): Iterator<T> {
    if (Option.isNone(set)) {
        return;
    }
    function* nodeToIterator(node: Node<T, never[]>): Iterable<T> {
        for (let i = 0; i < node.keys.length; ++i) {
            const next = node.edges[i]!;
            if (Option.isNone(next)) {
                return;
            }
            yield* nodeToIterator(Option.unwrap(next));
            yield node.keys[i]!;
        }
        const next = node.edges[node.keys.length]!;
        if (Option.isNone(next)) {
            return;
        }
        yield* nodeToIterator(Option.unwrap(next));
    }
    yield* nodeToIterator(Option.unwrap(set));
}

/**
 * Checks whether the `needle` is contained in the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param needle - Item to check.
 * @returns Whether the `set` has `needle`.
 */
export const has =
    <T>(ord: Ord<T>) =>
    (needle: T) =>
    (set: BTreeSet<T>): boolean => {
        if (Option.isNone(set)) {
            return false;
        }
        const node = set[1];
        for (let i = 0; i < node.keys.length; ++i) {
            switch (ord.cmp(needle, node.keys[i]!)) {
                case less:
                    return has(ord)(needle)(node.edges[i]!);
                case equal:
                    return true;
                case greater:
                    break;
            }
        }
        return has(ord)(needle)(node.edges[node.keys.length]!);
    };
