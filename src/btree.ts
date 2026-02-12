/**
 * This module provides an implementation of B-tree with the parameter `B` to 6.
 *
 * ## Methods
 *
 * Methods here can be categorized to map methods and set methods.
 *
 * ### Map methods
 *
 * - Construct
 *   - `newMap`
 *   - `fromIterable`
 * - Query
 *   - `isEmpty`
 *   - `get`
 *   - `containsKey`
 *   - `len`
 *   - `toIterator`
 *   - `toRevIterator`
 *   - `toKeys`
 *   - `toValues`
 *   - `firstKeyValue`
 *   - `lastKeyValue`
 *   - `range`
 * - Insert
 *   - `insert`
 * - Delete
 *   - `remove`
 *   - `popFirstKeyValue`
 *   - `popLastKeyValue`
 * - Fold
 *   - `reduceR`
 *   - `reduceL`
 *
 * ### Set methods
 *
 * - Construct
 *   - `newSet`
 *   - `setFromIterable`
 * - Query
 *   - `setToIterator`
 *   - `setToRevIterator`
 *   - `has`
 *   - `first`
 *   - `last`
 *   - `isDisjoint`
 *   - `isSuperset`
 * - Insert
 *   - `push`
 * - Delete
 *   - `pop`
 *   - `popFirst`
 *   - `popLast`
 * - Set operate
 *   - `union`
 *   - `symmetricDifferenceP
 *   - `difference`
 *   - `intersection`
 * - Fold
 *   - `setReduceR`
 *   - `setReduceL`
 *
 * Also most of map methods can be applied to `Set<T>`.
 *
 * @packageDocumentation
 * @module BTree
 */

import { Option, Result } from "../mod.js";
import {
    buildFromSorted,
    empty,
    findKeyIn,
    findMax,
    findMin,
    insertNotFull,
    isFull,
    isLeaf,
    mergeIterator,
    type Node,
    popMax,
    popMin,
    removeNotThin,
    splitChild,
} from "./btree/core.js";
import type { Apply2Only, Hkt1, Hkt2 } from "./hkt.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { contains, type RangeBounds } from "./range.js";
import type { State } from "./state.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Ord } from "./type-class/ord.js";
import type { PartialOrd } from "./type-class/partial-ord.js";
import type { Reduce } from "./type-class/reduce.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

//
// Map methods
//

/**
 * Stores the values `V` associated to the keys `K` which is expected to implement `Ord` type class.
 */
export type Map<K, V> = Node<K, V>;

/**
 * Creates a new `Map<K, V>`.
 *
 * @returns The new empty collection.
 */
export const newMap: <K, V>() => Map<K, V> = empty;

/**
 * Creates a new `Map<K, V>` from the iterable object generating `[K, V]`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param iterable - Entries source.
 * @returns The new collection with entries from `iterable`.
 */
export const fromIterable =
    <K>(ord: Ord<K>) =>
    <V>(entries: Iterable<[K, V]>): Map<K, V> => {
        const items = [...entries];
        items.sort(([a], [b]) => ord.cmp(a, b));
        return buildFromSorted(ord, items);
    };

/**
 * Checks whether the tree `map` is empty.
 *
 * @param map - To check.
 * @returns Whether `map` is empty.
 */
export const isEmpty = <K, V>(map: Map<K, V>): boolean => map.keys.length === 0;

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
    <V>(value: V): State<Map<K, V>, Option.Option<V>> =>
    (map: Map<K, V>): [old: Option.Option<V>, tree: Map<K, V>] => {
        if (isEmpty(map)) {
            return [
                Option.none(),
                {
                    keys: [key],
                    values: [value],
                    edges: null,
                },
            ];
        }

        if (!isFull(map)) {
            const [newNode, old] = insertNotFull(map, ord, key, value);
            return [old, newNode];
        }

        const [left, newNode, right] = splitChild(
            {
                keys: [],
                values: [],
                edges: [map],
            },
            0,
        );
        switch (ord.cmp(key, newNode.keys[0]!)) {
            case less: {
                const [newLeft, old] = insertNotFull(left, ord, key, value);
                return [
                    old,
                    {
                        ...newNode,
                        edges: newNode.edges.with(0, newLeft),
                    },
                ];
            }
            case equal: {
                return [
                    Option.some(newNode.values[0]!),
                    {
                        ...newNode,
                        values: newNode.values.with(0, value),
                    },
                ];
            }
            case greater: {
                const [newRight, old] = insertNotFull(right, ord, key, value);
                return [
                    old,
                    {
                        ...newNode,
                        edges: newNode.edges.with(1, newRight),
                    },
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
    <V>(map: Map<K, V>): [Option.Option<V>, Map<K, V>] => {
        if (isEmpty(map)) {
            return [Option.none(), map];
        }

        const [newMap, opt] = removeNotThin(map, key, ord);
        const removed = Option.map(([, value]: [K, V]) => value)(opt);
        return [removed, newMap];
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
    <V>(map: Map<K, V>): Option.Option<V> => {
        while (true) {
            if (isEmpty(map)) {
                return Option.none();
            }

            const posRes = findKeyIn(map, ord, key);
            if (isLeaf(map)) {
                return Option.map((index: number) => map.values[index]!)(
                    Result.optionOk(posRes),
                );
            }

            const index = Result.mergeOkErr(posRes);
            if (Result.isOk(posRes)) {
                return Option.some(map.values[index]!);
            }
            map = map.edges[index]!;
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
    <V>(map: Map<K, V>): boolean =>
        Option.isSome(get(ord)(key)(map));

/**
 * Counts the inserted items of `map`.
 *
 * @param map - To count.
 * @returns The size of the tree.
 */
export const len = <K, V>(map: Map<K, V>): number =>
    map.keys.length +
    (map.edges?.reduce((prev, edge) => prev + len(edge), 0) ?? 0);

/**
 * Converts the B-tree map into a `Generator` of `[K, V]` sorted by its ascending order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `[K, V]` key-value entries.
 */
export function* toIterator<K, V>(map: Map<K, V>): Generator<[K, V]> {
    if (isLeaf(map)) {
        for (let i = 0; i < map.keys.length; ++i) {
            yield [map.keys[i]!, map.values[i]!];
        }
    } else {
        for (let i = 0; i < map.keys.length; ++i) {
            yield* toIterator(map.edges[i]!);
            yield [map.keys[i]!, map.values[i]!];
        }
        yield* toIterator(map.edges[map.keys.length]!);
    }
}

/**
 * Converts the B-tree map into a `Generator` of `[K, V]` sorted by its descending order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `[K, V]` key-value entries.
 */
export function* toRevIterator<K, V>(map: Map<K, V>): Generator<[K, V]> {
    if (isLeaf(map)) {
        for (let i = map.keys.length - 1; i >= 0; ++i) {
            yield [map.keys[i]!, map.values[i]!];
        }
    } else {
        for (let i = map.keys.length - 1; i >= 0; ++i) {
            yield* toRevIterator(map.edges[i]!);
            yield [map.keys[i]!, map.values[i]!];
        }
        yield* toRevIterator(map.edges[map.keys.length]!);
    }
}

/**
 * Converts the B-tree map into a `Generator` of `K` sorted by its order.
 *
 * @param map - To convert.
 * @returns The iterator which generates `K` keys.
 */
export function* toKeys<K, V>(map: Map<K, V>): Generator<K> {
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
export function* toValues<K, V>(map: Map<K, V>): Generator<V> {
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
export const firstKeyValue = <K, V>(map: Map<K, V>): Option.Option<[K, V]> =>
    isEmpty(map) ? Option.none() : Option.some(findMin(map));

/**
 * Gets the last maximum key-value entry in `map`.
 *
 * @param map - Query target.
 * @returns The maximum key-value entry.
 */
export const lastKeyValue = <K, V>(map: Map<K, V>): Option.Option<[K, V]> =>
    isEmpty(map) ? Option.none() : Option.some(findMax(map));

/**
 * Removes the first minimum key-value entry in `map`.
 *
 * @param ord - The `Ord` instance for `K`.
 * @param map - Query target.
 * @returns The modified one and minimum key-value entry.
 */
export const popFirstKeyValue =
    <K>(ord: Ord<K>) =>
    <V>(map: Map<K, V>): [Option.Option<[K, V]>, Map<K, V>] => {
        if (isEmpty(map)) {
            return [Option.none(), map];
        }
        const [newMap, popped] = popMin(map, ord);
        return [popped, newMap];
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
    <V>(map: Map<K, V>): [Option.Option<[K, V]>, Map<K, V>] => {
        if (isEmpty(map)) {
            return [Option.none(), map];
        }
        const [newMap, popped] = popMax(map, ord);
        return [popped, newMap];
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
    (bounds: RangeBounds<K>): (<V>(map: Map<K, V>) => Generator<[K, V]>) => {
        return function* rangeGenerator<V>(map: Map<K, V>): Generator<[K, V]> {
            if (isEmpty(map)) {
                return;
            }

            // skip to start
            let i = 0;
            while (!contains(ord)(map.keys[i]!)(bounds)) {
                ++i;
                if (i >= map.keys.length) {
                    return;
                }
            }
            if (!isLeaf(map)) {
                yield* rangeGenerator(map.edges[i]!);
            }
            while (contains(ord)(map.keys[i]!)(bounds)) {
                yield [map.keys[i]!, map.values[i]!];
                ++i;
                if (i >= map.keys.length) {
                    return;
                }
                if (!isLeaf(map)) {
                    yield* rangeGenerator(map.edges[i]!);
                }
            }
        };
    };

/**
 * Higher kind type for `Map<_, _>`.
 */
export interface MapHkt extends Hkt2 {
    readonly type: Map<this["arg2"], this["arg1"]>;
}

/**
 * Folds the map into a value in descending order.
 *
 * @param reducer - Function to fold `A` and `B`.
 * @param map - To be folded.
 * @param init - The initial value on folding.
 * @returns The folded value.
 */
export const reduceR =
    <K, A, B>(reducer: (a: A) => (b: B) => B) =>
    (map: Map<K, A>) =>
    (init: B): B =>
        toRevIterator(map).reduce(
            (prev, [, curr]) => reducer(curr)(prev),
            init,
        );

/**
 * Folds the map into a value in ascending order.
 *
 * @param reducer - Function to fold `B` and `A`.
 * @param map - To be folded.
 * @param init - The initial value on folding.
 * @returns The folded value.
 */
export const reduceL =
    <K, A, B>(reducer: (b: B) => (a: A) => B) =>
    (init: B) =>
    (map: Map<K, A>): B =>
        toIterator(map).reduce((prev, [, curr]) => reducer(prev)(curr), init);

/**
 * The `Reduce` instance for `Map<K, _>`.
 */
export const reduce = <K>(): Reduce<Apply2Only<MapHkt, K>> => ({
    reduceR,
    reduceL,
});

//
// Set methods
//

/**
 * Stores the unique values `T` which is expected to implement `Ord` type class.
 */
export type Set<T> = Node<T, never[]>;

/**
 * Creates a new `Set<T>`.
 *
 * @returns The new empty collection.
 */
export const newSet: <T>() => Set<T> = empty;

/**
 * Creates a new `Set<T>` from the iterable object generating `T`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param iterable - Values source.
 * @returns The new collection with items from `iterable`.
 */
export const setFromIterable =
    <T>(ord: Ord<T>) =>
    (iterable: Iterable<T>): Set<T> => {
        const items = [...iterable];
        items.sort(ord.cmp);
        return buildFromSorted<T, never[]>(
            ord,
            items.map((item) => [item, []]),
        );
    };

/**
 * Converts the set into an iterator traversing contained items sorted by its ascending order.
 *
 * @param set - To be traversed.
 * @returns The iterator of contained items.
 */
export function* setToIterator<T>(set: Set<T>): Generator<T> {
    for (const [key] of toIterator(set)) {
        yield key;
    }
}

/**
 * Converts the set into an iterator traversing contained items sorted by its descending order.
 *
 * @param set - To be traversed.
 * @returns The iterator of contained items.
 */
export function* setToRevIterator<T>(set: Set<T>): Generator<T> {
    for (const [key] of toRevIterator(set)) {
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
    (set: Set<T>): boolean =>
        Option.isSome(get(ord)(needle)(set));

/**
 * Gets the first minimum item in `set`.
 *
 * @param map - Query target.
 * @returns The minimum item.
 */
export const first = <T>(set: Set<T>): Option.Option<T> =>
    isEmpty(set) ? Option.none() : Option.some(findMin(set)[0]);
/**
 * Gets the last maximum item in `set`.
 *
 * @param map - Query target.
 * @returns The maximum item.
 */
export const last = <T>(set: Set<T>): Option.Option<T> =>
    isEmpty(set) ? Option.none() : Option.some(findMax(set)[0]);

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
    (set: Set<T>): Set<T> =>
        insert(ord)(item)([])(set)[1];
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
    (set: Set<T>): Set<T> =>
        remove(ord)(item)(set)[1];
/**
 * Removes the minimum first item from the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param set - To be modified.
 * @returns The modified one and popped minimum item.
 */
export const popFirst =
    <T>(ord: Ord<T>) =>
    (set: Set<T>): [Option.Option<T>, Set<T>] => {
        const [popped, newSet] = popFirstKeyValue(ord)(set);
        return [Option.map(([item]: [T, never[]]) => item)(popped), newSet];
    }; /**
 * Removes the maximum last item from the `set`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param set - To be modified.
 * @returns The modified one and popped maximum item.
 */
export const popLast =
    <T>(ord: Ord<T>) =>
    (set: Set<T>): [Option.Option<T>, Set<T>] => {
        const [popped, newSet] = popLastKeyValue(ord)(set);
        return [Option.map(([item]: [T, never[]]) => item)(popped), newSet];
    };

/**
 * Unions two sets into one. It will collect items in `lhs` or `rhs` either without duplicates in ascending order.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The second item to union.
 * @param lhs - The first item to union.
 * @returns The iterator which generates intersection items `lhs ∪ rhs` without duplicates.
 */
export const union =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
        function* unionIterator(lhs: Set<T>): Generator<T> {
            for (const [l, r] of mergeIterator(
                setToIterator(lhs),
                setToIterator(rhs),
                ord.cmp,
            )) {
                const item = Option.unwrap(Option.or(r)(l));
                yield item;
            }
        };
/**
 * Subtracts two sets into one symmetrically. It will collect items in only one of `lhs` and `rhs` in ascending order.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The second item to difference.
 * @param lhs - The first item to difference.
 * @returns The iterator which generates symmetric difference items.
 */
export const symmetricDifference =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
        function* symmetricDifferenceIterator(lhs: Set<T>): Generator<T> {
            for (const [l, r] of mergeIterator(
                setToIterator(lhs),
                setToIterator(rhs),
                ord.cmp,
            )) {
                if (Option.isNone(Option.and(r)(l))) {
                    const item = Option.unwrap(Option.or(r)(l));
                    yield item;
                }
            }
        };

const SMALL_SET_RATIO_THRESHOLD = 16;

/**
 * Subtracts the `rhs` from `lhs`. It will collect items from `lhs` only if `rhs` contains them.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The right hand term of subtraction.
 * @param lhs - The left hand term of subtraction.
 * @returns The iterator which generates difference items `lhs \ rhs`.
 */
export const difference =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
        function* differenceIterator(lhs: Set<T>): Generator<T> {
            if (isEmpty(lhs)) {
                return;
            }
            if (isEmpty(rhs)) {
                yield* setToIterator(lhs);
                return;
            }

            const minL = Option.unwrap(first(lhs));
            const maxL = Option.unwrap(last(lhs));
            const minR = Option.unwrap(first(rhs));
            const maxR = Option.unwrap(last(rhs));
            const minLAndMaxR = ord.cmp(minL, maxR);
            const maxLAndMinR = ord.cmp(maxL, minR);
            if (minLAndMaxR === greater || maxLAndMinR === less) {
                yield* setToIterator(lhs);
                return;
            }
            if (minLAndMaxR === equal) {
                yield* setToIterator(popFirst(ord)(lhs)[1]);
                return;
            }
            if (maxLAndMinR === equal) {
                yield* setToIterator(popLast(ord)(lhs)[1]);
                return;
            }
            if (len(lhs) <= len(rhs) / SMALL_SET_RATIO_THRESHOLD) {
                // for small `lhs`, filters out each item of `lhs` by `rhs`
                for (const item of setToIterator(lhs)) {
                    if (has(ord)(item)(rhs)) {
                        yield item;
                    }
                }
                return;
            }

            // peeking items in `rhs` and comparing to items in `lhs`
            const genL = setToIterator(lhs);
            const genR = setToIterator(rhs);
            const genRFirst = genR.next();
            let peekedOpt = genRFirst.done
                ? Option.none()
                : Option.some(genRFirst.value);
            let next = genL.next();
            while (true) {
                if (next.done) {
                    return;
                }
                switch (
                    Option.mapOr<Ordering>(less)((peeked: T) =>
                        ord.cmp(next.value, peeked),
                    )(peekedOpt)
                ) {
                    case less:
                        yield next.value;
                        break;
                    case equal:
                        next = genL.next();
                        peekedOpt = genRFirst.done
                            ? Option.none()
                            : Option.some(genRFirst.value);
                        break;
                    case greater:
                        peekedOpt = genRFirst.done
                            ? Option.none()
                            : Option.some(genRFirst.value);
                        break;
                }
            }
        };
/**
 * Intersects two sets. It will collect items which are contained in both of `lhs` and `rhs`.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The right hand term of intersection.
 * @param lhs - The left hand term of intersection.
 * @returns The iterator which generates intersection items `lhs ∩ rhs`.
 */
export const intersection =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
        function* intersectionIterator(lhs: Set<T>): Generator<T> {
            if (isEmpty(lhs) || isEmpty(rhs)) {
                return;
            }

            const minL = Option.unwrap(first(lhs));
            const maxL = Option.unwrap(last(lhs));
            const minR = Option.unwrap(first(rhs));
            const maxR = Option.unwrap(last(rhs));
            const minLAndMaxR = ord.cmp(minL, maxR);
            const maxLAndMinR = ord.cmp(maxL, minR);

            if (minLAndMaxR === greater || maxLAndMinR === less) {
                return;
            }
            if (minLAndMaxR === equal) {
                yield minL;
                return;
            }
            if (maxLAndMinR === equal) {
                yield minR;
            }
            if (len(lhs) <= len(rhs) / SMALL_SET_RATIO_THRESHOLD) {
                // for small `lhs`, filters out each item of `lhs` by `rhs`
                for (const item of setToIterator(lhs)) {
                    if (has(ord)(item)(rhs)) {
                        yield item;
                    }
                }
                return;
            }
            if (len(rhs) <= len(lhs) / SMALL_SET_RATIO_THRESHOLD) {
                // for small `rhs`, filters out each item of `rhs` by `lhs`
                for (const item of setToIterator(rhs)) {
                    if (has(ord)(item)(lhs)) {
                        yield item;
                    }
                }
                return;
            }

            // peeking items in `lhs` and `rhs` and comparing each other
            const genL = setToIterator(lhs);
            const genR = setToIterator(rhs);
            let nextL = genL.next();
            let nextR = genR.next();
            while (true) {
                if (nextL.done || nextR.done) {
                    return;
                }
                switch (ord.cmp(nextL.value, nextR.value)) {
                    case less:
                        nextL = genL.next();
                        break;
                    case equal:
                        yield nextL.value;
                        nextL = genL.next();
                        nextR = genL.next();
                        break;
                    case greater:
                        nextR = genL.next();
                        break;
                }
            }
        };

/**
 * Checks whether two sets `lhs` and `rhs` are disjoint to each other.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The right hand term to check.
 * @param lhs - The left hand term to check.
 * @returns Whether `lhs` and `rhs` are disjoint (`lhs ∩ rhs = ∅`).
 */
export const isDisjoint =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean =>
        intersection(ord)(rhs)(lhs).next().done ?? false;
/**
 * Checks whether the set `lhs` is a subset to the set `rhs`. Note that the order of arguments is reversed.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The right hand term to check.
 * @param lhs - The left hand term to check.
 * @returns Whether `lhs` is a subset to `rhs` (`lhs ⊆ rhs`).
 */
export const isSubset =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean => {
        const leftLen = len(lhs);
        const rightLen = len(rhs);
        if (leftLen > rightLen) {
            // `lhs` has more elements than `rhs`
            return false;
        }
        const leftMinMax = Option.zip(first(lhs))(last(lhs));
        if (Option.isNone(leftMinMax)) {
            // `lhs` is empty
            return true;
        }
        const [leftMin, leftMax] = Option.unwrap(leftMinMax);

        const rightMinMax = Option.zip(first(rhs))(last(rhs));
        if (Option.isNone(rightMinMax)) {
            // `rhs` is empty
            return false;
        }
        const [rightMin, rightMax] = Option.unwrap(rightMinMax);

        if (ord.cmp(leftMin, rightMin) === less) {
            // `lhs`'s minimum is not in `rhs`
            return false;
        }
        if (ord.cmp(leftMax, rightMax) === greater) {
            // `lhs`'s maximum is not in `rhs`
            return false;
        }

        if (leftLen <= rightLen / SMALL_SET_RATIO_THRESHOLD) {
            // for small `lhs`, checks each item of `lhs` is in `rhs`
            return setToIterator(lhs).every((item) => has(ord)(item)(rhs));
        }

        // peeking items in `rhs` and comparing to `lhs'`s items
        const rightGen = setToIterator(rhs);
        // biome-ignore lint/suspicious/useIterableCallbackReturn: incorrect lint error
        return setToIterator(lhs).every((item) => {
            while (true) {
                const next = rightGen.next();
                if (next.done) {
                    return false;
                }
                switch (ord.cmp(next.value, item)) {
                    case less:
                        continue;
                    case equal:
                        return true;
                    case greater:
                        return false;
                }
            }
        });
    };
/**
 * Checks whether the set `lhs` is a superset to the set `rhs`. Note that the order of arguments is reversed.
 *
 * @param ord - The `Ord` instance for `T`.
 * @param rhs - The right hand term to check.
 * @param lhs - The left hand term to check.
 * @returns Whether `lhs` is a superset to `rhs` (`lhs ⊇ rhs`).
 */
export const isSuperset =
    <T>(ord: Ord<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean =>
        isSubset(ord)(lhs)(rhs);

/**
 * The `Monoid` instance about `Set`s and union operation.
 *
 * @param ord - The `Ord` instance for `T`.
 * @returns The `Monoid` of union operation to `Set`s.
 */
export const unionMonoid = <T>(ord: Ord<T>): Monoid<Set<T>> => ({
    identity: empty(),
    combine: (l, r) => setFromIterable(ord)(union(ord)(r)(l)),
    [semiGroupSymbol]: true,
});

/**
 * Higher kind type for `Set<_>`.
 */
export interface SetHkt extends Hkt1 {
    readonly type: Set<this["arg1"]>;
}

/**
 * Folds the set into a value in descending order.
 *
 * @param reducer - Function to fold `A` and `B`.
 * @param set - To be folded.
 * @param init - The initial value on folding.
 * @returns The folded value.
 */
export const setReduceR =
    <A, B>(reducer: (a: A) => (b: B) => B) =>
    (set: Set<A>) =>
    (init: B): B =>
        setToRevIterator(set).reduce((prev, curr) => reducer(curr)(prev), init);

/**
 * Folds the set into a value in ascending order.
 *
 * @param reducer - Function to fold `A` and `B`.
 * @param init - The initial value on folding.
 * @param set - To be folded.
 * @returns The folded value.
 */
export const setReduceL =
    <A, B>(reducer: (b: B) => (a: A) => B) =>
    (init: B) =>
    (set: Set<A>): B =>
        setToIterator(set).reduce((prev, curr) => reducer(prev)(curr), init);

/**
 * The `Reduce` instance for `Set<_>`.
 */
export const setReduce: Reduce<SetHkt> = {
    reduceR: setReduceR,
    reduceL: setReduceL,
};
