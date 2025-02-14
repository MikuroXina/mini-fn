/**
 * This module provides functions to operate {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map | `Map`} dictionary object in an immutable way.
 *
 * @module
 * @packageDocumentation
 */

import type { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import { cmp as listCmp, fromIterable, type List, toIterator } from "./list.ts";
import { isNone, isSome, none, type Option, some } from "./option.ts";
import type { Ordering } from "./ordering.ts";
import { isOk, type Result } from "./result.ts";
import { type Decoder, type Encoder, mapDecoder } from "./serial.ts";
import {
    dec as decTuple,
    enc as encTuple,
    ord as tupleOrd,
    type Tuple,
} from "./tuple.ts";
import { dec as decArray, enc as encArray } from "./array.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
    type PartialEqUnary,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import type { Traversable } from "./type-class/traversable.ts";
import { andThen } from "./ordering.ts";

/**
 * Compares two `Map`s with an equality between `L` and `R`.
 *
 * @param equality - The `PartialEq` instance for `L` and `R`.
 * @param l - Left hand side to compare.
 * @param r - Right hand side to compare.
 * @returns Whether two `Map`s equal.
 */
export const eq =
    <K, L, R = L>(equality: PartialEq<L, R>) =>
    (l: Map<K, L>, r: Map<K, R>): boolean => {
        if (l.size !== r.size) {
            return false;
        }
        for (const [leftKey, leftValue] of l) {
            const rightValue = r.get(leftKey);
            if (
                !r.has(leftKey) ||
                !equality.eq(leftValue, rightValue!)
            ) {
                return false;
            }
        }
        return true;
    };
/**
 * Compares two `Map`s with orders of key and value.
 *
 * @param ordK - The `Ord` instance for `K`.
 * @param ordV - The `Ord` instance for `V`.
 * @param l - Left hand side to compare.
 * @param r - Right hand side to compare.
 * @returns The comparison result in {@link Ordering.Ordering | `Ordering`}. It will be always a {@link Option.Some | `Some`}.
 */
export const partialCmp = <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) =>
(l: Map<K, V>, r: Map<K, V>): Option<Ordering> => {
    return some(cmp(ord)(l, r));
};
/**
 * Compares two `Map`s with orders of key and value.
 *
 * @param ordK - The `Ord` instance for `K`.
 * @param ordV - The `Ord` instance for `V`.
 * @param l - Left hand side to compare.
 * @param r - Right hand side to compare.
 * @returns The comparison result in {@link Ordering.Ordering | `Ordering`}.
 */
export const cmp = <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) =>
(l: Map<K, V>, r: Map<K, V>): Ordering => {
    const sorter = sortedEntries(ord);
    const sortedL = sorter(l);
    const sortedR = sorter(r);
    return listCmp<Tuple<K, V>>(
        tupleOrd({ ordA: ord.ordK, ordB: ord.ordV }),
    )(sortedL, sortedR);
};

/**
 * Generates a partial equality between `Map<K, L>` and `Map<K, R>` from the equality between `L` and `R`.
 *
 * It doesn't require an equality of `K` because `Map` uses `SameValueZero` algorithm as an equality of keys.
 */
export const partialEquality: <K, L, R = L>(
    equality: PartialEq<L, R>,
) => PartialEq<Map<K, L>, Map<K, R>> = fromPartialEquality(eq);
/**
 * Generates a total equality between `Map<K, L>` and `Map<K, R>` from the equality between `L` and `R`.
 *
 * It doesn't require an equality of `K` because `Map` uses `SameValueZero` algorithm as an equality of keys.
 */
export const equality: <K, L, R = L>(
    equality: Eq<L, R>,
) => Eq<Map<K, L>, Map<K, R>> = fromEquality(eq);
/**
 * Generates a partial order of `Map<K, V>` from the total orders of `K` and `V`.
 *
 * The reason why it requires `Ord`s is the algorithm compares their entry in sorted order.
 */
export const partialOrd: <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) => PartialOrd<Map<K, V>> = fromPartialCmp(partialCmp);
/**
 * Generates a total order of `Map<K, V>` from the orders of `K` and `V`.
 */
export const ord: <K, V>(ord: {
    ordK: Ord<K>;
    ordV: Ord<V>;
}) => Ord<Map<K, V>> = fromCmp(cmp);

/**
 * The `PartialEqUnary` instance for `Map<K, _>`.
 */
export const partialEqUnary = <K>(): PartialEqUnary<Apply2Only<MapHkt, K>> => ({
    liftEq:
        <L, R = L>(equality: (l: L, r: R) => boolean) =>
        (l: Map<K, L>, r: Map<K, R>): boolean =>
            eq<K, L, R>({ eq: equality })(l, r),
});

/**
 * Checks whether the dictionary is empty.
 *
 * @param m - To be checked.
 * @returns Whether the dictionary has no elements.
 */
export const isEmpty = <K, V>(m: Map<K, V>): boolean => m.size === 0;
/**
 * Gets the number of items in the dictionary.
 *
 * @param m - To be queried.
 * @returns The number of items in the dictionary.
 */
export const size = <K, V>(m: Map<K, V>): number => m.size;

/**
 * Queries whether the key is in the dictionary.
 *
 * @param key - Key to check.
 * @param m - To be checked.
 * @returns Whether the dictionary has an entry with the key.
 */
export const has = <K>(key: K) => <V>(m: Map<K, V>): boolean => m.has(key);
/**
 * Gets the item by the specified key from the dictionary.
 *
 * @param key - Key to get.
 * @param m - To be queried.
 * @returns Related value with the key if exists, or `None` if not.
 */
export const get = <K>(key: K) => <V>(m: Map<K, V>): Option<V> =>
    m.has(key) ? some(m.get(key)!) : none();

/**
 * Creates a new empty `Map` object.
 *
 * @returns A new `Map`.
 */
export const empty = <K, V>(): Map<K, V> => new Map();

/**
 * Creates a new `Map` object with the single entry.
 *
 * @param key - Related object for querying the value.
 * @param value - To be contained.
 * @returns A new `Map` with an entry of key and value.
 */
export const singleton = <K>(key: K) => <V>(value: V): Map<K, V> =>
    new Map([[key, value]]);

/**
 * Creates a new `Map` from the list of dictionary entries. If there are duplicate keys, the last one takes precedence.
 *
 * @param list - List of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromList = <K, V>(list: List<Tuple<K, V>>): Map<K, V> =>
    new Map<K, V>(toIterator(list));
/**
 * Creates a new `Map` from the list of dictionary entries. If there are duplicate keys, `combiner` will be called to merge two values.
 *
 * @param combiner - Function to merge values when found a duplicate key.
 * @param list - List of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromListWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(list: List<Tuple<K, V>>): Map<K, V> => {
        const m = new Map<K, V>();
        for (const [key, value] of toIterator(list)) {
            if (m.has(key)) {
                m.set(key, combiner(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
        }
        return m;
    };
/**
 * Creates a new `Map` from the list of dictionary entries. If there are duplicate keys, `combiner` will be called to merge two values.
 *
 * @param combiner - Function to merge values when found a duplicate key. Also the duplicated key will be passed.
 * @param list - List of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromListWithKey =
    <K, V>(combiner: (key: K) => (newValue: V) => (oldValue: V) => V) =>
    (list: List<Tuple<K, V>>): Map<K, V> => {
        const m = new Map<K, V>();
        for (const [key, value] of toIterator(list)) {
            if (m.has(key)) {
                m.set(key, combiner(key)(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
        }
        return m;
    };

/**
 * Creates a new `Map` from the array of dictionary entries. If there are duplicate keys, the last one takes precedence.
 *
 * @param arr - Array of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromArray = <K, V>(arr: readonly Tuple<K, V>[]): Map<K, V> =>
    new Map<K, V>(arr);
/**
 * Creates a new `Map` from the array of dictionary entries. If there are duplicate keys, `combiner` will be called to merge two values.
 *
 * @param combiner - Function to merge values when found a duplicate key.
 * @param arr - Array of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromArrayWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(arr: readonly Tuple<K, V>[]): Map<K, V> => {
        const m = new Map<K, V>();
        for (const [key, value] of arr) {
            if (m.has(key)) {
                m.set(key, combiner(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
        }
        return m;
    };

/**
 * Creates a new `Map` from the array of dictionary entries. If there are duplicate keys, `combiner` will be called to merge two values.
 *
 * @param combiner - Function to merge values when found a duplicate key. Also the duplicated key will be passed.
 * @param arr - Array of entries.
 * @returns A new `Map` made from the entries.
 */
export const fromArrayWithKey =
    <K, V>(combiner: (key: K) => (newValue: V) => (oldValue: V) => V) =>
    (arr: readonly Tuple<K, V>[]): Map<K, V> => {
        const m = new Map<K, V>();
        for (const [key, value] of arr) {
            if (m.has(key)) {
                m.set(key, combiner(key)(value)(m.get(key)!));
            } else {
                m.set(key, value);
            }
        }
        return m;
    };

/**
 * Counts occurring items and record it by item as key.
 *
 * @param items - To be counted.
 * @returns The counts by item.
 */
export const countItems = <K>(items: List<K>): Map<K, number> => {
    const m = new Map<K, number>();
    for (const item of toIterator(items)) {
        if (m.has(item)) {
            m.set(item, m.get(item)! + 1);
        } else {
            m.set(item, 1);
        }
    }
    return m;
};

/**
 * Clones the `Map` object with a shallow copy method. If you want to clone `Map` deeply, you can use {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone | `structuredClone`} function.
 *
 * @param m - To be cloned.
 * @returns A new cloned one.
 */
export const clone = <K, V>(m: Map<K, V>): Map<K, V> => new Map(m);

/**
 * Inserts a new entry with the key and value to the `Map` object immutably. If there is already an entry with the key, it will be overwritten.
 *
 * @param key - Key to relate insertion.
 * @param value - Value to insert.
 * @param m - To be inserted.
 * @returns A new one with the inserted entry.
 */
export const insert =
    <K>(key: K) => <V>(value: V) => (m: Map<K, V>): Map<K, V> =>
        clone(m).set(key, value);
/**
 * Inserts a new entry with the key and value to the `Map` object immutably. If there is already an entry with the key, `combiner` will be called to merge their values.
 *
 * @param combiner - Function to merge values when found a duplicate key.
 * @param key - Key to relate insertion.
 * @param value - Value to insert.
 * @param m - To be inserted.
 * @returns A new one with the inserted entry.
 */
export const insertWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K>(key: K) =>
    (value: V) =>
    (m: Map<K, V>): Map<K, V> => {
        const cloned = clone(m);
        if (cloned.has(key)) {
            return cloned.set(key, combiner(value)(cloned.get(key)!));
        }
        return cloned.set(key, value);
    };
/**
 * Inserts a new entry with the key and value to the `Map` object immutably. If there is already an entry with the key, `combiner` will be called to merge their values.
 *
 * @param combiner - Function to merge values when found a duplicate key. Also the duplicated key will be passed.
 * @param key - Key to relate insertion.
 * @param value - Value to insert.
 * @param m - To be inserted.
 * @returns A new one with the inserted entry.
 */
export const insertWithKey =
    <K, V>(combiner: (key: K) => (newValue: V) => (oldValue: V) => V) =>
    (key: K) =>
    (value: V) =>
    (m: Map<K, V>): Map<K, V> => {
        const cloned = clone(m);
        if (cloned.has(key)) {
            return cloned.set(key, combiner(key)(value)(cloned.get(key)!));
        }
        return cloned.set(key, value);
    };

/**
 * Removes an entry with the key, or does nothing if there isn't.
 *
 * @param key - Key of entry to remove.
 * @param m - To be removed.
 * @returns A new `Map` without the specified entry, or as is if there isn't.
 */
export const remove = <K>(key: K) => <V>(m: Map<K, V>): Map<K, V> => {
    if (!m.has(key)) {
        return m;
    }
    const cloned = clone(m);
    cloned.delete(key);
    return cloned;
};

/**
 * Modifies value of entry with the key, or does nothing if there isn't.
 *
 * @param mapper - Function to map the value.
 * @param key - Key of entry to modify.
 * @param m - To be modified.
 * @returns A new `Map` with the replaced entry, or as is if there isn't.
 */
export const adjust =
    <V>(mapper: (oldValue: V) => V) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const cloned = clone(m);
        return cloned.set(key, mapper(m.get(key)!));
    };
/**
 * Modifies value of entry with the key, or does nothing if there isn't.
 *
 * @param mapper - Function to map the value. Also the key will be passed to.
 * @param key - Key of entry to modify.
 * @param m - To be modified.
 * @returns A new `Map` with the replaced entry, or as is if there isn't.
 */
export const adjustWithKey =
    <K, V>(mapper: (key: K) => (oldValue: V) => V) =>
    (key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const cloned = clone(m);
        return cloned.set(key, mapper(key)(m.get(key)!));
    };

/**
 * Modifies or removes entry with the key, or does nothing if there isn't.
 *
 * @param updater - Function to map the value. When it returned `None`, the entry will be removed.
 * @param key - Key of entry to modify.
 * @param m - To be modified.
 * @returns A new `Map` with the replaced entry, or as is if there isn't.
 */
export const update =
    <V>(updater: (oldValue: V) => Option<V>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const toUpdate = updater(m.get(key)!);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };
/**
 * Modifies or removes entry with the key, or does nothing if there isn't.
 *
 * @param updater - Function to map the value. Also the key will be passed to. When this returned `None`, the entry will be removed.
 * @param key - Key of entry to modify.
 * @param m - To be modified.
 * @returns A new `Map` with the replaced entry, or as is if there isn't.
 */
export const updateWithKey =
    <K, V>(updater: (key: K) => (oldValue: V) => Option<V>) =>
    (key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        if (!m.has(key)) {
            return m;
        }
        const toUpdate = updater(key)(m.get(key)!);
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };
/**
 * Alters entry with the key. This lets you insert, modify and remove an entry.
 *
 * @param updater - Function to make a new value from the old one. If the entry was not found, `oldEntry` will be `None`. When this returned `None`, the entry will be removed.
 * @param key - Key of entry to alter.
 * @param m - To be altered.
 * @returns A new `Map` with the replaced entry.
 */
export const alter =
    <V>(updater: (oldEntry: Option<V>) => Option<V>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Map<K, V> => {
        const toUpdate = updater(get(key)(m));
        if (isNone(toUpdate)) {
            return remove(key)(m);
        }
        return insert(key)(toUpdate[1])(m);
    };

/**
 * Alternates entry with the key over the functor `F`. This lets you insert, modify and remove an entry contained by `F`.
 *
 * @param f - The `Functor` instance for `F`.
 * @param updater - Function to make a new `F` value from the old one. If the entry was not found, `oldEntry` will be `None`. When this returned `None` over `F`, the entry will be removed.
 * @param key - Key of entry to alter.
 * @param m - To be altered.
 * @returns A new `Map` with the replaced entry.
 */
export const alterF =
    <F>(f: Functor<F>) =>
    <V>(updater: (oldEntry: Option<V>) => Get1<F, Option<V>>) =>
    <K>(key: K) =>
    (m: Map<K, V>): Get1<F, Map<K, V>> =>
        f.map((toUpdate: Option<V>) =>
            isNone(toUpdate) ? remove(key)(m) : insert(key)(toUpdate[1])(m)
        )(updater(get(key)(m)));

/**
 * Combines two `Map`s into another one. If there are duplicate keys, the ones in `left` will take precedence.
 *
 * @param left - Left hand side to be combined, taking precedence.
 * @param right - Right hand side to be combined.
 * @returns A new `Map` with entries came from both of them.
 */
export const union = <K, V>(left: Map<K, V>) => (right: Map<K, V>): Map<K, V> =>
    new Map([...right, ...left]);

/**
 * Combines two `Map`s into another one. If there are duplicate keys, their value will be merged with `combiner`.
 *
 * @param combiner - Function to merge left and right values where entries have duplicate key.
 * @param left - Left hand side to be combined.
 * @param right - Right hand side to be combined.
 * @returns A new `Map` with entries came from both of them.
 */
export const unionWith =
    <V>(combiner: (left: V) => (right: V) => V) =>
    <K>(left: Map<K, V>) =>
    (right: Map<K, V>): Map<K, V> => {
        const cloned = clone(left);
        for (const [rightKey, rightValue] of right) {
            if (cloned.has(rightKey)) {
                cloned.set(
                    rightKey,
                    combiner(cloned.get(rightKey)!)(rightValue),
                );
            } else {
                cloned.set(rightKey, rightValue);
            }
        }
        return cloned;
    };
/**
 * Combines two `Map`s into another one. If there are duplicate keys, their value will be merged with `combiner`.
 *
 * @param combiner - Function to merge left and right values where entries have duplicate key. Also the key will be passed to.
 * @param left - Left hand side to be combined.
 * @param right - Right hand side to be combined.
 * @returns A new `Map` with entries came from both of them.
 */
export const unionWithKey =
    <K, V>(combiner: (key: K) => (left: V) => (right: V) => V) =>
    (left: Map<K, V>) =>
    (right: Map<K, V>): Map<K, V> => {
        const cloned = clone(left);
        for (const [rightKey, rightValue] of right) {
            if (cloned.has(rightKey)) {
                cloned.set(
                    rightKey,
                    combiner(rightKey)(cloned.get(rightKey)!)(rightValue),
                );
            } else {
                cloned.set(rightKey, rightValue);
            }
        }
        return cloned;
    };
/**
 * The `Monoid` instance for combining with {@link Map.union | `union`}.
 */
export const unionMonoid = <K, V>(): Monoid<Map<K, V>> => ({
    identity: empty(),
    combine: (l, r) => union(l)(r),
    [semiGroupSymbol]: true,
});

/**
 * Makes a difference `left - right` immutably. The entries which are in `right` will be removed from `left`.
 *
 * @param left - To be removed.
 * @param right - Haystack keys to remove.
 * @returns A new `Map` without the entries with key in `right`.
 */
export const difference =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): Map<K, V1> => {
        const cloned = clone(left);
        for (const rightKey of right.keys()) {
            cloned.delete(rightKey);
        }
        return cloned;
    };
/**
 * Makes a difference `left - right` immutably like {@link Map.difference | `difference`}, but you can replace the element instead of removing.
 *
 * @param combiner - Function to determine how the item to be updated. Values related to the key in `left` and `right` will be passed to this.
 * @param left - To be removed.
 * @param right - Haystack keys to remove.
 * @returns A new `Map` with the entries merged by `combiner`.
 */
export const differenceWith = <V1, V2 = V1>(
    combiner: (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
<K>(left: Map<K, V1>) =>
(right: Map<K, V2>): Map<K, V1> => {
    const cloned = clone(left);
    for (const [rightKey, rightValue] of right) {
        if (!cloned.has(rightKey)) {
            continue;
        }
        const toUpdate = combiner(left.get(rightKey)!)(rightValue);
        if (isNone(toUpdate)) {
            cloned.delete(rightKey);
        } else {
            cloned.set(rightKey, toUpdate[1]);
        }
    }
    return cloned;
};
/**
 * Makes a difference `left - right` immutably like {@link Map.difference | `difference`}, but you can replace the element instead of removing.
 *
 * @param combiner - Function to determine how the item to be updated. Values related to the key in `left` and `right` will be passed to this. Also the key will be passed to.
 * @param left - To be removed.
 * @param right - Haystack keys to remove.
 * @returns A new `Map` with the entries merged by `combiner`.
 */
export const differenceWithKey = <K, V1, V2 = V1>(
    combiner: (key: K) => (leftValue: V1) => (rightValue: V2) => Option<V1>,
) =>
(left: Map<K, V1>) =>
(right: Map<K, V2>): Map<K, V1> => {
    const cloned = clone(left);
    for (const [rightKey, rightValue] of right) {
        if (!cloned.has(rightKey)) {
            continue;
        }
        const toUpdate = combiner(rightKey)(left.get(rightKey)!)(
            rightValue,
        );
        if (isNone(toUpdate)) {
            cloned.delete(rightKey);
        } else {
            cloned.set(rightKey, toUpdate[1]);
        }
    }
    return cloned;
};

/**
 * Makes an intersection, consisting entries which is in both of `left` and `right`. When picking up common key of them, the value of the `left` side hand will be used.
 *
 * @param left - The left hand side dictionary.
 * @param right - The right hand side dictionary.
 * @returns An intersection of `left` and `right`.
 */
export const intersection =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): Map<K, V1> => {
        const m = new Map<K, V1>();
        for (const [leftKey, leftValue] of left) {
            if (right.has(leftKey)) {
                m.set(leftKey, leftValue);
            }
        }
        return m;
    };
/**
 * Makes an intersection, consisting entries which is in both of `left` and `right`. When picking up common key of them, `combiner` will be called to merge values of them.
 *
 * @param combiner - Function to merge values of them.
 * @param left - The left hand side dictionary.
 * @param right - The right hand side dictionary.
 * @returns A new merged `Map`.
 */
export const intersectionWith =
    <V1, V2 = V1, V3 = V1>(combiner: (left: V1) => (right: V2) => V3) =>
    <K>(left: Map<K, V1>) =>
    (right: Map<K, V2>): Map<K, V3> => {
        const m = new Map<K, V3>();
        for (const [leftKey, leftValue] of left) {
            if (right.has(leftKey)) {
                m.set(leftKey, combiner(leftValue)(right.get(leftKey)!));
            }
        }
        return m;
    };
/**
 * Makes an intersection, consisting entries which is in both of `left` and `right`. When picking up common key of them, `combiner` will be called to merge values of them.
 *
 * @param combiner - Function to merge values of them. Also the key will be passed to.
 * @param left - The left hand side dictionary.
 * @param right - The right hand side dictionary.
 * @returns A new merged `Map`.
 */
export const intersectionWithKey = <K, V1, V2 = V1, V3 = V1>(
    combiner: (key: K) => (left: V1) => (right: V2) => V3,
) =>
(left: Map<K, V1>) =>
(right: Map<K, V2>): Map<K, V3> => {
    const m = new Map<K, V3>();
    for (const [leftKey, leftValue] of left) {
        if (right.has(leftKey)) {
            m.set(
                leftKey,
                combiner(leftKey)(leftValue)(right.get(leftKey)!),
            );
        }
    }
    return m;
};

/**
 * Checks whether two `Map`s are disjoint about its keys.
 *
 * @param left - The left hand side dictionary.
 * @param right - The right hand side dictionary.
 * @returns Whether two `Map`s have no common keys.
 */
export const isDisjoint =
    <K, V1>(left: Map<K, V1>) => <V2>(right: Map<K, V2>): boolean => {
        for (const leftKey of left.keys()) {
            if (right.has(leftKey)) {
                return false;
            }
        }
        return true;
    };

/**
 * Connects two `Maps` and makes a new `Map` with resolution their key-value relations.
 *
 * @param uv - The dictionary maps from `U` to `V`.
 * @param tu - The dictionary maps from `T` to `U`.
 * @returns A new dictionary maps from `T` to `V`.
 */
export const compose =
    <U, V>(uv: Map<U, V>) => <T>(tu: Map<T, U>): Map<T, V> => {
        const m = new Map<T, V>();
        for (const [t, u] of tu) {
            if (uv.has(u)) {
                m.set(t, uv.get(u)!);
            }
        }
        return m;
    };

/**
 * Transforms values in the `Map` by `mapper`.
 *
 * @param mapper - Function to transform values.
 * @param ma - To be transformed.
 * @returns A new `Map` with mapped values.
 */
export const map =
    <A, B>(mapper: (a: A) => B) => <K>(ma: Map<K, A>): Map<K, B> => {
        const mb = new Map<K, B>();
        for (const [key, value] of ma) {
            mb.set(key, mapper(value));
        }
        return mb;
    };
/**
 * Transforms values in the `Map` by `mapper`.
 *
 * @param mapper - Function to transform values. Also the key will be passed to.
 * @param ma - To be transformed.
 * @returns A new `Map` with mapped values.
 */
export const mapWithKey = <K, A, B>(mapper: (key: K) => (a: A) => B) =>
(
    ma: Map<K, A>,
): Map<K, B> => {
    const mb = new Map<K, B>();
    for (const [key, value] of ma) {
        mb.set(key, mapper(key)(value));
    }
    return mb;
};

/**
 * Traverses the `Map` into the data structure `X` on applicative functor `T`.
 *
 * @param app - The `Applicative` instance for `T`.
 * @param visitor - Function to fold values into data `X` on `T`.
 * @param m - To be traversed.
 * @returns The folded `Map` on `T`.
 */
export const traverse =
    <T>(app: Applicative<T>) =>
    <V, X>(visitor: (value: V) => Get1<T, X>) =>
    <K>(m: Map<K, V>): Get1<T, Map<K, X>> => {
        let acc = app.pure(new Map<K, X>());
        for (const [key, value] of m) {
            acc = app.apply(app.map(insert(key))(visitor(value)))(acc);
        }
        return acc;
    };

/**
 * Traverses the `Map` into the data structure `B` on applicative functor `T`.
 *
 * @param app - The `Applicative` instance for `T`.
 * @param visitor - Function to fold values into data `B` on `T`. Also the key will be passed to.
 * @param m - To be traversed.
 * @returns The folded `Map` on `T`.
 */
export const traverseWithKey =
    <T>(app: Applicative<T>) =>
    <K, A, B>(mapper: (key: K) => (a: A) => Get1<T, B>) =>
    (ka: Map<K, A>): Get1<T, Map<K, B>> => {
        let traversing = app.pure(new Map<K, B>());
        for (const [key, value] of ka) {
            traversing = app.apply(app.map(insert(key))(mapper(key)(value)))(
                traversing,
            );
        }
        return traversing;
    };

/**
 * Traverses the `Map` into the optional data `B` on applicative functor `T`.
 *
 * @param app - The `Applicative` instance for `T`.
 * @param visitor - Function to fold values into optional data `B` on `T`. Also the key will be passed to. If it returned `None`, the entry will be removed from result.
 * @param m - To be traversed.
 * @returns The folded `Map` on `T`.
 */
export const traverseSomeWithKey =
    <T>(app: Applicative<T>) =>
    <K, A, B>(mapper: (key: K) => (a: A) => Get1<T, Option<B>>) =>
    (ka: Map<K, A>): Get1<T, Map<K, B>> => {
        let traversing = app.pure(new Map<K, B>());
        for (const [key, value] of ka) {
            traversing = app.apply(
                app.map((optB: Option<B>) => (kb: Map<K, B>): Map<K, B> =>
                    isNone(optB) ? kb : insert(key)(optB[1])(kb)
                )(
                    mapper(key)(value),
                ),
            )(traversing);
        }
        return traversing;
    };

/**
 * Scans over the `Map` with `scanner` function, a stateful computation.
 *
 * @param scanner - Function to process output `R` from value with accumulating state `A`.
 * @param init - Initial accumulating state of `scanner`.
 * @param m - To be scanned.
 * @returns The last accumulating state and new scanned `Map`.
 */
export const scan =
    <A, V, R>(scanner: (acc: A) => (value: V) => Tuple<A, R>) =>
    (init: A) =>
    <K>(m: Map<K, V>): Tuple<A, Map<K, R>> => {
        let acc = init;
        const kr = new Map<K, R>();
        for (const [key, value] of m) {
            const [a, r] = scanner(acc)(value);
            kr.set(key, r);
            acc = a;
        }
        return [acc, kr];
    };

/**
 * Scans over the `Map` with `scanner` function, a stateful computation.
 *
 * @param scanner - Function to process output `R` from value with accumulating state `A`. Also the key will be passed to.
 * @param init - Initial accumulating state of `scanner`.
 * @param m - To be scanned.
 * @returns The last accumulating state and new scanned `Map`.
 */
export const scanWithKey =
    <A, K, V, R>(scanner: (acc: A) => (key: K) => (value: V) => Tuple<A, R>) =>
    (init: A) =>
    (m: Map<K, V>): Tuple<A, Map<K, R>> => {
        let acc = init;
        const kr = new Map<K, R>();
        for (const [key, value] of m) {
            const [a, r] = scanner(acc)(key)(value);
            kr.set(key, r);
            acc = a;
        }
        return [acc, kr];
    };

/**
 * Transforms the `Map` with replacing keys. If there duplicate keys on replaced, the last one will take precedence.
 *
 * @param mapper - Function to transform keys.
 * @param m - To be transformed.
 * @returns A new `Map` with new keys.
 */
export const mapKeys =
    <K1, K2>(mapper: (key: K1) => K2) => <V>(m: Map<K1, V>): Map<K2, V> => {
        const k2v = new Map<K2, V>();
        for (const [key, value] of m) {
            k2v.set(mapper(key), value);
        }
        return k2v;
    };
/**
 * Transforms the `Map` with replacing keys. If there duplicate keys on replaced, `combiner` will be called to merge their value.
 *
 * @param combiner - Function to merge values with duplicate keys.
 * @param mapper - Function to transform keys.
 * @param m - To be transformed.
 * @returns A new `Map` with new keys.
 */
export const mapKeysWith =
    <V>(combiner: (newValue: V) => (oldValue: V) => V) =>
    <K1, K2>(mapper: (key: K1) => K2) =>
    (m: Map<K1, V>): Map<K2, V> => {
        const k2v = new Map<K2, V>();
        for (const [key, value] of m) {
            const mappedKey = mapper(key);
            if (k2v.has(mappedKey)) {
                k2v.set(mappedKey, combiner(value)(k2v.get(mappedKey)!));
            } else {
                k2v.set(mappedKey, value);
            }
        }
        return k2v;
    };

/**
 * Folds the `Map` into an accumulated `X` with folding computation from the last entry.
 *
 * @param folder - Function to fold an item and accumulated value.
 * @param init - Initial data of accumulating.
 * @param m - To be folded.
 * @returns Accumulated result.
 */
export const foldR =
    <V, X>(folder: (item: V) => (acc: X) => X) =>
    (init: X) =>
    <K>(m: Map<K, V>): X => {
        let acc = init;
        for (const value of [...m.values()].toReversed()) {
            acc = folder(value)(acc);
        }
        return acc;
    };
/**
 * Folds the `Map` into an accumulated `X` with folding computation from the last entry.
 *
 * @param folder - Function to fold an item and accumulated value. Also the key will be passed to.
 * @param init - Initial data of accumulating.
 * @param m - To be folded.
 * @returns Accumulated result.
 */
export const foldRWithKey =
    <K, V, X>(folder: (key: K) => (item: V) => (acc: X) => X) =>
    (init: X) =>
    (m: Map<K, V>): X => {
        let acc = init;
        for (const [key, value] of [...m.entries()].toReversed()) {
            acc = folder(key)(value)(acc);
        }
        return acc;
    };

/**
 * Folds the `Map` into an accumulated `X` with folding computation from the first entry.
 *
 * @param folder - Function to fold an item and accumulated value.
 * @param init - Initial data of accumulating.
 * @param m - To be folded.
 * @returns Accumulated result.
 */
export const foldL =
    <V, X>(folder: (acc: X) => (item: V) => X) =>
    (init: X) =>
    <K>(m: Map<K, V>): X => {
        let acc = init;
        for (const value of m.values()) {
            acc = folder(acc)(value);
        }
        return acc;
    };
/**
 * Folds the `Map` into an accumulated `X` with folding computation from the first entry.
 *
 * @param folder - Function to fold an item and accumulated value. Also the key will be passed to.
 * @param init - Initial data of accumulating.
 * @param m - To be folded.
 * @returns Accumulated result.
 */
export const foldLWithKey =
    <K, V, X>(folder: (key: K) => (acc: X) => (item: V) => X) =>
    (init: X) =>
    (m: Map<K, V>): X => {
        let acc = init;
        for (const [key, value] of m) {
            acc = folder(key)(acc)(value);
        }
        return acc;
    };

/**
 * Transforms entries of the `Map` into data of `M` and folds into one by {@link TypeClass.Monoid.Combine | `Monoid.combine`} from the first entry.
 *
 * @param mon - The `Monoid` instance for `M`.
 * @param folder - Function to map an entry into data of `M`.
 * @param m - To be folded.
 * @returns Accumulated result.
 */
export const foldMapWithKey =
    <M>(mon: Monoid<M>) =>
    <K, V>(folder: (key: K) => (value: V) => M) =>
    (m: Map<K, V>): M => {
        let acc = mon.identity;
        for (const [key, value] of m) {
            acc = mon.combine(acc, folder(key)(value));
        }
        return acc;
    };

/**
 * Gets keys list of the `Map`.
 *
 * @param m - To be queried.
 * @returns List of keys.
 */
export const keys = <K, V>(m: Map<K, V>): List<K> => fromIterable(m.keys());
/**
 * Gets values list of the `Map`.
 *
 * @param m - To be queried.
 * @returns List of values.
 */
export const values = <K, V>(m: Map<K, V>): List<V> => fromIterable(m.values());
/**
 * Gets entries, key-value list of the `Map`.
 *
 * @param m - To be queried.
 * @returns List of entries.
 */
export const entries = <K, V>(m: Map<K, V>): List<Tuple<K, V>> =>
    fromIterable(m.entries());

/**
 * Gets entries sorted by the `Ord` instances.
 *
 * @param orders - The `Ord` instances for `K` and `V`.
 * @param m - To be queried.
 * @returns Sorted list of entries.
 */
export const sortedEntries =
    <K, V>({ ordK, ordV }: { ordK: Ord<K>; ordV: Ord<V> }) =>
    (m: Map<K, V>): List<Tuple<K, V>> => {
        const entries = [...m];
        entries.sort((
            [aKey, aValue],
            [bKey, bValue],
        ) => (
            andThen(() => ordV.cmp(aValue, bValue))(ordK.cmp(aKey, bKey))
        ));
        return fromIterable(entries);
    };

/**
 * Filters the `Map`, picking only values matching the predicate.
 *
 * @param pred - Predicate whether picks an item.
 * @param m - To be filtered.
 * @returns A new filtered `Map`.
 */
export const filter =
    <V>(pred: (value: V) => boolean) => <K>(m: Map<K, V>): Map<K, V> => {
        const filtered = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(value)) {
                filtered.set(key, value);
            }
        }
        return filtered;
    };
/**
 * Filters the `Map`, picking only entries matching the predicate.
 *
 * @param pred - Predicate whether picks an entry, key and value.
 * @param m - To be filtered.
 * @returns A new filtered `Map`.
 */
export const filterWithKey =
    <K, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Map<K, V>): Map<K, V> => {
        const filtered = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(key)(value)) {
                filtered.set(key, value);
            }
        }
        return filtered;
    };

/**
 * Splits the `Map` into two, matched and dropped by the predicate.
 *
 * @param pred - Predicate whether picks an item.
 * @param m - To be split.
 * @returns Two `Map`s, matched and dropped.
 */
export const partition =
    <V>(pred: (value: V) => boolean) =>
    <K>(m: Map<K, V>): [satisfied: Map<K, V>, dropped: Map<K, V>] => {
        const satisfied = new Map<K, V>();
        const dropped = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(value)) {
                satisfied.set(key, value);
            } else {
                dropped.set(key, value);
            }
        }
        return [satisfied, dropped];
    };
/**
 * Splits the `Map` into two, matched and dropped by the predicate.
 *
 * @param pred - Predicate whether picks an entry.
 * @param m - To be split.
 * @returns Two `Map`s, matched and dropped.
 */
export const partitionWithKey =
    <K, V>(pred: (key: K) => (value: V) => boolean) =>
    (m: Map<K, V>): [satisfied: Map<K, V>, dropped: Map<K, V>] => {
        const satisfied = new Map<K, V>();
        const dropped = new Map<K, V>();
        for (const [key, value] of m) {
            if (pred(key)(value)) {
                satisfied.set(key, value);
            } else {
                dropped.set(key, value);
            }
        }
        return [satisfied, dropped];
    };

/**
 * Transforms the `Map` with lossy conversion `mapper`.
 *
 * @param mapper - Function to transform into `W`, but optional. If it returned `None`, the value will be dropped.
 * @param m - To be transformed.
 * @returns A new transformed `Map`.
 */
export const mapOption =
    <V, W>(mapper: (value: V) => Option<W>) => <K>(m: Map<K, V>): Map<K, W> => {
        const kw = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(value);
            if (isSome(mapped)) {
                kw.set(key, mapped[1]);
            }
        }
        return kw;
    };
/**
 * Transforms the `Map` with lossy conversion `mapper`.
 *
 * @param mapper - Function to transform into `W`, but optional. If it returned `None`, the value will be dropped. Also the key will be passed to.
 * @param m - To be transformed.
 * @returns A new transformed `Map`.
 */
export const mapOptionWithKey =
    <K, V, W>(mapper: (key: K) => (value: V) => Option<W>) =>
    (m: Map<K, V>): Map<K, W> => {
        const kw = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(key)(value);
            if (isSome(mapped)) {
                kw.set(key, mapped[1]);
            }
        }
        return kw;
    };

/**
 * Transforms the `Map` with fail-able conversion `mapper`.
 *
 * @param mapper - Function to transform into `W`, but fail-able. If it returned `Err`, the value will be collected to `errors`.
 * @param m - To be transformed.
 * @returns Two `Map`s, error values and ok values.
 */
export const mapResult =
    <V, E, W>(mapper: (value: V) => Result<E, W>) =>
    <K>(m: Map<K, V>): [errors: Map<K, E>, oks: Map<K, W>] => {
        const errors = new Map<K, E>();
        const oks = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(value);
            if (isOk(mapped)) {
                oks.set(key, mapped[1]);
            } else {
                errors.set(key, mapped[1]);
            }
        }
        return [errors, oks];
    };
/**
 * Transforms the `Map` with fail-able conversion `mapper`.
 *
 * @param mapper - Function to transform into `W`, but fail-able. If it returned `Err`, the value will be collected to `errors`. Also the key will be passed to.
 * @param m - To be transformed.
 * @returns Two `Map`s, error values and ok values.
 */
export const mapResultWithKey =
    <K, V, E, W>(mapper: (key: K) => (value: V) => Result<E, W>) =>
    (m: Map<K, V>): [errors: Map<K, E>, oks: Map<K, W>] => {
        const errors = new Map<K, E>();
        const oks = new Map<K, W>();
        for (const [key, value] of m) {
            const mapped = mapper(key)(value);
            if (isOk(mapped)) {
                oks.set(key, mapped[1]);
            } else {
                errors.set(key, mapped[1]);
            }
        }
        return [errors, oks];
    };

/**
 * Checks whether all entries of `subset` is included in `superset` with custom equality.
 *
 * @param equality - An equality between `V` and `W`.
 * @param subset - The left hand side to be checked.
 * @param superset - The right hand side to be checked.
 * @returns Whether all entries of `subset` is included in `superset`.
 */
export const isSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K>(subset: Map<K, V>) =>
    (superset: Map<K, W>): boolean => {
        for (const [key, value] of subset) {
            if (!superset.has(key)) {
                return false;
            }
            if (!equality(value)(superset.get(key)!)) {
                return false;
            }
        }
        return true;
    };
/**
 * Checks whether all entries of `subset` is included in `superset`.
 *
 * @param equality - The `PartialEq` instance between `V` and `W`.
 * @param subset - The left hand side to be checked.
 * @param superset - The right hand side to be checked.
 * @returns Whether all entries of `subset` is included in `superset`.
 */
export const isSubsetOf = <V, W = V>(
    equality: PartialEq<V, W>,
): <K>(subset: Map<K, V>) => (superset: Map<K, W>) => boolean =>
    isSubsetOfBy((sub: V) => (sup: W) => equality.eq(sub, sup));

/**
 * Checks whether all entries of `subset` is included in `superset` with custom equality. But if there are same entries properly, it will be `false`.
 *
 * @param equality - An equality between `V` and `W`.
 * @param subset - The left hand side to be checked.
 * @param superset - The right hand side to be checked.
 * @returns Whether all entries of `subset` is included in `superset`.
 */
export const isProperSubsetOfBy =
    <V, W>(equality: (sub: V) => (sup: W) => boolean) =>
    <K>(subset: Map<K, V>) =>
    (superset: Map<K, W>): boolean => {
        for (const [key, value] of subset) {
            if (!superset.has(key)) {
                return false;
            }
            if (!equality(value)(superset.get(key)!)) {
                return false;
            }
        }
        return subset.size < superset.size;
    };
/**
 * Checks whether all entries of `subset` is included in `superset`. But if there are same entries properly, it will be `false`.
 *
 * @param equality - The `PartialEq` instance between `V` and `W`.
 * @param subset - The left hand side to be checked.
 * @param superset - The right hand side to be checked.
 * @returns Whether all entries of `subset` is included in `superset`.
 */
export const isProperSubsetOf = <V, W = V>(
    equality: PartialEq<V, W>,
): <K>(subset: Map<K, V>) => (superset: Map<K, W>) => boolean =>
    isSubsetOfBy((sub: V) => (sup: W) => equality.eq(sub, sup));

export interface MapHkt extends Hkt2 {
    readonly type: Map<this["arg2"], this["arg1"]>;
}

/**
 * The `Functor` instance for `Map<K, _>`.
 */
export const functor = <K>(): Functor<Apply2Only<MapHkt, K>> => ({ map });

/**
 * The `Functor` instance for `Map<K, _>`.
 */
export const foldable = <K>(): Foldable<Apply2Only<MapHkt, K>> => ({ foldR });

/**
 * The `Traversable` instance for `Map<K, _>`.
 */
export const traversable = <K>(): Traversable<Apply2Only<MapHkt, K>> => ({
    map,
    foldR,
    traverse,
});

/**
 * Serializes the `Map` into a binary sequence.
 *
 * @param encK - The `Encoder` instance for `K`.
 * @param encV - The `Encoder` instance for `V`.
 * @returns A new `Encoder` instance for `Map<K, V>`.
 */
export const enc =
    <K>(encK: Encoder<K>) =>
    <V>(encV: Encoder<V>): Encoder<Map<K, V>> =>
    (value) => encArray(encTuple(encK)(encV))([...value.entries()]);
/**
 * Deserializes the `Map` from a binary sequence.
 *
 * @param decK - The `Decoder` instance for `K`.
 * @param decV - The `Decoder` instance for `V`.
 * @returns A new `Decoder` instance for `Map<K, V>`/
 */
export const dec =
    <K>(decK: Decoder<K>) => <V>(decV: Decoder<V>): Decoder<Map<K, V>> =>
        mapDecoder((kv: Tuple<K, V>[]) => new Map(kv))(
            decArray(decTuple(decK)(decV)),
        );
