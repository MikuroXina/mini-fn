/**
 * This modules provides an implementation of hash table.
 *
 * ## Methods
 *
 * Methods here can be categorized to map methods and set methods.
 *
 * ### Map methods
 *
 * - Construct
 *   - `newMap`
 *   - `newMapWith`
 * - Query
 *   - `len`
 *   - `isEmpty`
 *   - `get`
 *   - `contains`
 *   - `entries`
 *   - `keys`
 *   - `values`
 *   - `hasher`
 * - Modify
 *   - `insert`
 *   - `remove`
 *
 * ### Set methods
 *
 * - Construct
 *   - `newSet`
 *   - `newSetWith`
 * - Query
 *   - `items`
 *   - `isDisjoint`
 *   - `isSubset`
 *   - `isSuperset`
 * - Modify
 *   - `push`
 *   - `pop`
 * - Set operation
 *   - `union`
 *   - `difference`
 *   - `symmetricDifference`
 *   - `intersection`
 *
 * Also most of map methods can be applied to `Set<T>`.
 *
 * @packageDocumentation
 * @module Hash
 */

import {
    controlsToMask,
    erase,
    find,
    findAll,
    full,
    newTable,
    type Table,
    write,
} from "./hash/core.js";
import { type Mut, type MutRef, mapMut } from "./mut.js";
import * as Option from "./option.js";
import * as Result from "./result.js";
import { defaultHasher, type Hash, type Hasher } from "./type-class/hash.js";

export type { Hash };

// Map methods

/**
 * A hash table, associative dictionary with `Hash`-able `K` and `V`.
 */
export type Map<K, V> = Table<K, V>;

/**
 * Creates a new `Map<K, V>` with a default SipHash 1-3 hasher.
 *
 * @returns The new hash table dictionary.
 */
export const newMap = <K, V>(): Map<K, V> => newTable(defaultHasher());

/**
 * Creates a new `Map<K, V>` with the provided hasher.
 *
 * @returns The new hash table dictionary.
 */
export const newMapWith = <K, V>(hasher: Hasher): Map<K, V> => newTable(hasher);

/**
 * Gets the counts of items in the hash table `map`.
 *
 * @param map - To be queried.
 * @returns The number of inserted items.
 */
export const len = <K, V>(map: Map<K, V>): number => map.len;

/**
 * Checks whether the hash table `map` is empty.
 *
 * @param map - To be queried.
 * @returns Whether `map` is empty.
 */
export const isEmpty = <K, V>(map: Map<K, V>): boolean => map.len === 0;

/**
 * Gets the value corresponding to the key.
 *
 * @param hash - The `Hash` instance for `K`.
 * @param key - Querying target.
 * @param map - To be queried.
 * @returns The value associated to the key if it exists.
 */
export const get =
    <K>(hash: Hash<K>) =>
    (key: K) =>
    <V>(map: Map<K, V>): Option.Option<V> => {
        const posRes = find(key, controlsToMask(full), hash, map);
        return Option.map((pos: number) => map.values[pos]!)(
            Result.optionOk(posRes),
        );
    };

/**
 * Checks whether the map contains the key.
 *
 * @param hash - The `Hash` instance for `K`.
 * @param key - Querying target.
 * @param map - To be queried.
 * @returns Whether `map` contains `key`.
 */
export const contains =
    <K>(hash: Hash<K>) =>
    (key: K) =>
    <V>(map: Map<K, V>): boolean =>
        Option.isSome(get(hash)(key)(map));

/**
 * Creates the iterator which generates key-value entries in the hash table dictionary `map`.
 *
 * @param map - To be queries.
 * @returns The generator of key-value pairs in `map`.
 */
export function* entries<K, V>(map: Map<K, V>): Generator<[K, V]> {
    yield* findAll(controlsToMask(full), map);
}

/**
 * Creates the iterator which generates keys in the hash table dictionary `map`.
 *
 * @param map - To be queries.
 * @returns The generator of keys in `map`.
 */
export function* keys<K, V>(map: Map<K, V>): Generator<K> {
    for (const [key] of entries(map)) {
        yield key;
    }
}

/**
 * Creates the iterator which generates values in the hash table dictionary `map`.
 *
 * @param map - To be queries.
 * @returns The generator of values in `map`.
 */
export function* values<K, V>(map: Map<K, V>): Generator<V> {
    for (const [, value] of entries(map)) {
        yield value;
    }
}

/**
 * Obtains the internal hasher of hash table dictionary.
 *
 * @param map - A hash table dictionary.
 * @returns The internal hasher instance.
 */
export const hasher = <K, V>(map: Map<K, V>): Hasher => map.hasher;

/**
 * Inserts `value` associated to `key` into the hash table `map`.
 *
 * @param hash - The `Hash` instance for `K`.
 * @param key - To associate.
 * @param value - To be inserted.
 * @param map - To be modified.
 * @returns Mutating computation which results the old value if it already exists.
 */
export const insert =
    <K>(hash: Hash<K>) =>
    (key: K) =>
    <V>(value: V) =>
    <S>(map: MutRef<S, Map<K, V>>): Mut<S, Option.Option<V>> =>
        write(key, value, hash, map);

/**
 * Removes the value associated to `key` from the hash table `map`.
 *
 * @param hash - The `Hash` instance for `K`.
 * @param key - To remove.
 * @param map - To be modified.
 * @returns Mutating computation which results the removed value if it exists.
 */
export const remove =
    <K>(hash: Hash<K>) =>
    (key: K) =>
    <V, S>(map: MutRef<S, Map<K, V>>): Mut<S, Option.Option<V>> =>
        erase(key, hash, map);

// Set methods

/**
 * A hash table, set data structure with `Hash`-able `T`.
 */
export type Set<T> = Table<T, never[]>;

/**
 * Creates a new `Set<T>` with a default SipHash 1-3 hasher.
 *
 * @returns The new hash table set.
 */
export const newSet = <T>(): Set<T> => newTable(defaultHasher());

/**
 * Creates a new `Set<T>` with the provided hasher.
 *
 * @returns The new hash table dictionary.
 */
export const newSetWith = <T>(hasher: Hasher): Set<T> => newTable(hasher);

/**
 * Creates the iterator which generates items in the hash table set `set`.
 *
 * @param map - To be queries.
 * @returns The generator of items in `set`.
 */
export function* items<T>(set: Set<T>): Generator<T> {
    yield* keys(set);
}

/**
 * Inserts the value into the hash table set.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param item - To insert.
 * @param set - To be modified.
 * @returns Mutating computation which results whether the value was newly inserted.
 */
export const push =
    <T>(hash: Hash<T>) =>
    (item: T) =>
    <S>(set: MutRef<S, Set<T>>): Mut<S, boolean> =>
        mapMut(Option.isNone<never[]>)(insert(hash)(item)([])(set));

/**
 * Removes the value from the hash table set.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param item - To remove.
 * @param set - To be modified.
 * @returns Mutating computation which results whether the value was present in.
 */
export const pop =
    <T>(hash: Hash<T>) =>
    (item: T) =>
    <S>(set: MutRef<S, Set<T>>): Mut<S, boolean> =>
        mapMut(Option.isSome<never[]>)(remove(hash)(item)(set));

/**
 * Unions two sets without duplicates and returns an iterator of the items `lhs ∪ rhs`.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term of union operation.
 * @param lhs - Left hand term of union operation.
 * @returns An iterator which generates items of the union.
 */
export const union =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
        function* unionGenerator(lhs: Set<T>): Generator<T> {
            if (len(lhs) >= len(rhs)) {
                yield* items(lhs);
                yield* difference(hash)(lhs)(rhs);
            } else {
                yield* items(rhs);
                yield* difference(hash)(rhs)(lhs);
            }
        };

/**
 * Differences `lhs` from `rhs` and returns an iterator of the items `lhs \ rhs`. Note that the order of arguments is reversed.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term of difference operation.
 * @param lhs - Left hand term of difference operation.
 * @returns An iterator which generates items of the difference.
 */
export const difference =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
        function* differenceGenerator(lhs: Set<T>): Generator<T> {
            for (const item of items(lhs)) {
                if (!contains(hash)(item)(rhs)) {
                    yield item;
                }
            }
        };

/**
 * Differences symmetrically `lhs` from `rhs` and returns an iterator of the items.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term of symmetric difference operation.
 * @param lhs - Left hand term of symmetric difference operation.
 * @returns An iterator which generates items of the symmetric difference.
 */
export const symmetricDifference =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
        function* symmetricDifferenceGenerator(lhs: Set<T>): Generator<T> {
            yield* difference(hash)(rhs)(lhs);
            yield* difference(hash)(lhs)(rhs);
        };

/**
 * Intersects two sets and returns an iterator of the items `lhs ∩ rhs`.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term of intersection operation.
 * @param lhs - Left hand term of intersection operation.
 * @returns An iterator which generates items of the intersection.
 */
export const intersection =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
        function* intersectionGenerator(lhs: Set<T>): Generator<T> {
            for (const item of items(lhs)) {
                if (contains(hash)(item)(rhs)) {
                    yield item;
                }
            }
        };

/**
 * Checks whether two sets are disjoint.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term.
 * @param lhs - Left hand term.
 * @returns Whether `lhs` and `rhs` are disjoint.
 */
export const isDisjoint =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean => {
        if (len(lhs) <= len(rhs)) {
            for (const v of items(lhs)) {
                if (contains(hash)(v)(rhs)) {
                    return false;
                }
            }
        } else {
            for (const v of items(rhs)) {
                if (contains(hash)(v)(lhs)) {
                    return false;
                }
            }
        }
        return true;
    };

/**
 * Determines whether `lhs` is a subset of `rhs`. Note that the order of arguments is reversed.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term.
 * @param lhs - Left hand term.
 * @returns Result of `lhs ⊆ rhs`.
 */
export const isSubset =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean => {
        if (len(lhs) <= len(rhs)) {
            for (const v of items(lhs)) {
                if (!contains(hash)(v)(rhs)) {
                    return false;
                }
            }
        }
        return true;
    };

/**
 * Determines whether `lhs` is a superset of `rhs`. Note that the order of arguments is reversed.
 *
 * @param hash - The `Hash` instance for `T`.
 * @param rhs - Right hand term.
 * @param lhs - Left hand term.
 * @returns Result of `lhs ⊇ rhs`.
 */
export const isSuperset =
    <T>(hash: Hash<T>) =>
    (rhs: Set<T>) =>
    (lhs: Set<T>): boolean =>
        isSubset(hash)(lhs)(rhs);
