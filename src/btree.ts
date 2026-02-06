/**
 * This module provides an implementation of B-tree with the parameter `B` to 6.
 *
 * ## Methods
 *
 * - ``
 *
 * ## Development note
 *
 * A B-tree (this custom) must maintain the following invariants:
 *
 * 1. Leaf nodes are at the same depth.
 * 2. Keys of each node are stored in the ascending order by `Ord` instance for `K`.
 * 3. Intermediate nodes have at least 6 children.
 * 4. Every nodes except root have at least 5 keys.
 * 5. Root node has no children or at least 2 children.
 * 6. A non-leaf node with `k` keys contains `k + 1` children.
 *
 * @packageDocumentation
 * @module
 */

import { Option, Result } from "../mod.js";
import {
    branch,
    empty,
    findKeyIn,
    findMax,
    findMin,
    insertNotFull,
    isFull,
    isLeaf,
    type Node,
    popMax,
    popMin,
    removeNotThin,
    splitChild,
    type Tree,
} from "./btree/core.js";
import { equal, greater, less } from "./ordering.js";
import { contains, type RangeBounds } from "./range.js";
import type { Ord } from "./type-class/ord.js";
import type { PartialOrd } from "./type-class/partial-ord.js";

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
 * Checks whether the tree `map` is empty.
 *
 * @param map - To check.
 * @returns Whether `map` is empty.
 */
export const isEmpty = <K, V>(map: BTreeMap<K, V>): boolean =>
    Option.isNone(map);

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
            return [
                branch({
                    keys: [key],
                    values: [value],
                    edges: [empty(), empty()],
                }),
                Option.none(),
            ];
        }

        const node = Option.unwrap(map);
        if (!isFull(node)) {
            const [newNode, old] = insertNotFull(node, ord, key, value);
            return [branch(newNode), old];
        }

        const [left, newNode, right] = splitChild(node, 0);
        switch (ord.cmp(key, newNode.keys[0]!)) {
            case less: {
                const [newLeft, old] = insertNotFull(left, ord, key, value);
                return [
                    branch({
                        ...newNode,
                        edges: newNode.edges.with(0, branch(newLeft)),
                    }),
                    old,
                ];
            }
            case equal: {
                return [
                    branch({
                        ...newNode,
                        values: newNode.values.with(0, value),
                    }),
                    Option.some(newNode.values[0]!),
                ];
            }
            case greater: {
                const [newRight, old] = insertNotFull(right, ord, key, value);
                return [
                    branch({
                        ...newNode,
                        edges: newNode.edges.with(1, branch(newRight)),
                    }),
                    old,
                ];
            }
        }
    };

/**
 * Removes the entry keyed by `key` and returns the removed item if it exists.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Specifying the entry.
 * @param map - Removal target.
 * @returns The removed one if it exists.
 */
export const remove =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(map: BTreeMap<K, V>): [BTreeMap<K, V>, Option.Option<V>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }

        const [newMap, opt] = removeNotThin(Option.unwrap(map), key, ord);
        return [branch(newMap), Option.map(([, value]: [K, V]) => value)(opt)];
    };

/**
 * Gets the item associated to `key` in `map`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Querying the entry.
 * @param map - Query target.
 * @returns The found item if it exists.
 */
export const get =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(map: BTreeMap<K, V>): Option.Option<V> => {
        while (true) {
            if (Option.isNone(map)) {
                return Option.none();
            }

            const node = Option.unwrap(map);
            const posRes = findKeyIn(node, ord, key);
            if (isLeaf(node)) {
                return Option.map((index: number) => node.values[index]!)(
                    Result.optionOk(posRes),
                );
            }

            const index = Result.mergeOkErr(posRes);
            if (Result.isOk(posRes)) {
                return Option.some(node.values[index]!);
            }
            map = node.edges[index]!;
        }
    };

/**
 * Checks whether the map contains the entry by `key`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param key - Querying the entry.
 * @param map - Query target.
 * @returns Whether the map contains `key`.
 */
export const containsKey =
    <K>(ord: Ord<K>) =>
    (key: K) =>
    <V>(map: BTreeMap<K, V>): boolean =>
        Option.isSome(get(ord)(key)(map));

/**
 * Counts the inserted items of `map`.
 *
 * @param map - To count.
 * @returns The size of the tree.
 */
export const len = <K, V>(map: BTreeMap<K, V>): number =>
    Option.mapOr(0)(
        (node: Node<K, V>) =>
            node.keys.length +
            node.edges.reduce((prev, edge) => prev + len(edge), 0),
    )(map);

/**
 * Converts the B-tree map into a `Generator` of `[K, V]` sorted by its order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `[K, V]` key-value entries.
 */
export function* toIterator<K, V>(map: BTreeMap<K, V>): Generator<[K, V]> {
    if (Option.isNone(map)) {
        return;
    }

    const node = Option.unwrap(map);
    for (let i = 0; i < node.keys.length; ++i) {
        yield* toIterator(node.edges[i]!);
        yield [node.keys[i]!, node.values[i]!];
    }
    yield* toIterator(node.edges[node.keys.length]!);
}

/**
 * Converts the B-tree map into a `Generator` of `K` sorted by its order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `K` keys.
 */
export function* toKeys<K, V>(map: BTreeMap<K, V>): Generator<K> {
    for (const [key] of toIterator(map)) {
        yield key;
    }
}

/**
 * Converts the B-tree map into a `Generator` of `V` sorted by its `K`'s order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `V` values.
 */
export function* toValues<K, V>(map: BTreeMap<K, V>): Generator<V> {
    for (const [, value] of toIterator(map)) {
        yield value;
    }
}

/**
 * Gets the first minimum key-value entry in `map`.
 *
 * @param map - Query target.
 * @returns The minimum key-value entry.
 */
export const firstKeyValue = <K, V>(
    map: BTreeMap<K, V>,
): Option.Option<[K, V]> => Option.map(findMin)(map);

/**
 * Gets the last maximum key-value entry in `map`.
 *
 * @param map - Query target.
 * @returns The maximum key-value entry.
 */
export const lastKeyValue = <K, V>(
    map: BTreeMap<K, V>,
): Option.Option<[K, V]> => Option.map(findMax)(map);

/**
 * Removes the first minimum key-value entry in `map`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param map - Query target.
 * @returns The modified one and minimum key-value entry.
 */
export const popFirstKeyValue =
    <K>(ord: Ord<K>) =>
    <V>(map: BTreeMap<K, V>): [BTreeMap<K, V>, Option.Option<[K, V]>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }
        const node = Option.unwrap(map);
        const [newNode, popped] = popMin(node, ord);
        return [branch(newNode), popped];
    };

/**
 * Removes the first maximum key-value entry in `map`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param map - Query target.
 * @returns The modified one and maximum key-value entry.
 */
export const popLastKeyValue =
    <K>(ord: Ord<K>) =>
    <V>(map: BTreeMap<K, V>): [BTreeMap<K, V>, Option.Option<[K, V]>] => {
        if (Option.isNone(map)) {
            return [map, Option.none()];
        }
        const node = Option.unwrap(map);
        const [newNode, popped] = popMax(node, ord);
        return [branch(newNode), popped];
    };

/**
 * Queries the items of `map` in the `range`.
 *
 * @param ord - The `PartialOrd` instance for `K`.
 * @param range - Querying bounds of keys.
 * @param map - To be queries.
 * @returns The iterator which generates `[K, V]` key-value entries which its key is contained in `range`.
 */
export const range =
    <K>(ord: PartialOrd<K>) =>
    (bounds: RangeBounds<K>) =>
        function* rangeGenerator<V>(map: BTreeMap<K, V>): Generator<[K, V]> {
            if (Option.isNone(map)) {
                return;
            }

            const node = Option.unwrap(map);
            // skip to start
            let i = 0;
            while (!contains(ord)(node.keys[i]!)(bounds)) {
                ++i;
                if (i >= node.keys.length) {
                    return;
                }
            }
            yield* range(ord)(bounds)(node.edges[i]!);
            while (contains(ord)(node.keys[i]!)(bounds)) {
                yield [node.keys[i]!, node.values[i]!];
                ++i;
                if (i >= node.keys.length) {
                    return;
                }
                yield* range(ord)(bounds)(node.edges[i]!);
            }
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
 * Converts the set into an iterator traversing contained items sorted by its order.
 *
 * @param set - To be traversed.
 * @returns The iterator of contained items.
 */
export function* setToIterator<T>(set: BTreeSet<T>): Generator<T> {
    for (const [key] of toIterator(set)) {
        yield key;
    }
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
    (set: BTreeSet<T>): boolean =>
        Option.isSome(get(ord)(needle)(set));

/**
 * Gets the first minimum item in `set`.
 *
 * @param map - Query target.
 * @returns The minimum item.
 */
export const first = <T>(set: BTreeSet<T>): Option.Option<T> =>
    Option.map((node: Node<T, never[]>) => findMin(node)[0])(set);
/**
 * Gets the last maximum item in `set`.
 *
 * @param map - Query target.
 * @returns The maximum item.
 */
export const last = <T>(set: BTreeSet<T>): Option.Option<T> =>
    Option.map((node: Node<T, never[]>) => findMax(node)[0])(set);

/**
 * Adds an `item` to the `set`. Duplicated keys will have no effect.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param item - To add.
 * @param set - To be modified.
 * @returns The modified one.
 */
export const push =
    <T>(ord: Ord<T>) =>
    (item: T) =>
    (set: BTreeSet<T>): BTreeSet<T> =>
        insert(ord)(item)([])(set)[0];
/**
 * Removes an `item` from the `set`. Not found keys will have no effect.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param item - To remove.
 * @param set - To be modified.
 * @returns The modified one.
 */
export const pop =
    <T>(ord: Ord<T>) =>
    (item: T) =>
    (set: BTreeSet<T>): BTreeSet<T> =>
        remove(ord)(item)(set)[0];
/**
 * Removes the minimum first item from the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param set - To be modified.
 * @returns The modified one and popped minimum item.
 */
export const popFirst =
    <T>(ord: Ord<T>) =>
    (set: BTreeSet<T>): [BTreeSet<T>, Option.Option<T>] => {
        const [newSet, popped] = popFirstKeyValue(ord)(set);
        return [newSet, Option.map(([item]: [T, never[]]) => item)(popped)];
    }; /**
 * Removes the maximum last item from the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param set - To be modified.
 * @returns The modified one and popped maximum item.
 */
export const popLast =
    <T>(ord: Ord<T>) =>
    (set: BTreeSet<T>): [BTreeSet<T>, Option.Option<T>] => {
        const [newSet, popped] = popLastKeyValue(ord)(set);
        return [newSet, Option.map(([item]: [T, never[]]) => item)(popped)];
    };
