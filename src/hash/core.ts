import { doT } from "../cat.js";
import {
    type Mut,
    type MutRef,
    monad as mutMonad,
    readMutRef,
} from "../mut.js";
import * as Option from "../option.js";
import type { Hash, Hasher } from "../type-class/hash.js";

const LOAD_FACTOR = 0.875;

export const empty = 0 as const;
export const sentinel = 1 as const;
export const tombstone = 2 as const;
export const full = 3 as const;

export type Control =
    | typeof sentinel
    | typeof tombstone
    | typeof empty
    | typeof full;

declare const maskNominal: unique symbol;
export type Mask = number & { [maskNominal]: never };

export const controlsToMask = (...controls: Control[]): Mask =>
    controls.reduce((prev: number, curr) => prev | curr, 0) as Mask;

export interface Table<K, V> {
    /**
     * Hash algorithm used to store keys.
     */
    hasher: Hasher;
    /**
     * Count of inserted items.
     */
    len: number;
    /**
     * Flags to control elements behavior.
     */
    controls: Uint8Array;
    /**
     * Keys of inserted entries.
     */
    keys: K[];
    /**
     * Corresponding values of inserted entries.
     */
    values: V[];
}

/**
 * Converts `key` into the starting index of querying `keys` in `table`.
 *
 * @param key - To be converted.
 * @param table - Query target.
 * @returns Starting index of querying.
 */
const keyToStartIndex = <K>(key: K, hash: Hash<K>, hasher: Hasher): number => {
    const state = hash.hash(key)(hasher).state();
    return Number(BigInt.asUintN(32, state));
};

/**
 * Creates a new table from `Hasher`.
 */
export const newTable = <K, V>(hasher: Hasher): Table<K, V> => ({
    hasher,
    len: 0,
    controls: new Uint8Array(),
    keys: [],
    values: [],
});

/**
 * Finds the proper index for `key` in the `table`.
 */
export const find = <K, V>(
    key: K,
    targetMask: Mask,
    hash: Hash<K>,
    table: Table<K, V>,
): Option.Option<number> => {
    const pos = keyToStartIndex(key, hash, table.hasher) % table.keys.length;
    for (let i = 0; ; i += 4) {
        // linear probing
        const probedPos = (pos + i) % table.keys.length;
        if (
            (table.controls[probedPos]! & targetMask) !== 0 &&
            hash.eq(key, table.keys[probedPos]!)
        ) {
            return Option.some(probedPos);
        }
        if (table.controls[probedPos]! === empty) {
            return Option.none();
        }
    }
};

export function* findAll<K, V>(
    targetMask: Mask,
    table: Table<K, V>,
): Generator<[K, V]> {
    for (let i = 0; i < table.controls.length; ++i) {
        if ((table.controls[i]! & targetMask) !== 0) {
            yield [table.keys[i]!, table.values[i]!];
        }
    }
}

const extend = <S, K, V>(
    hash: Hash<K>,
    table: MutRef<S, Table<K, V>>,
): Mut<S, never[]> =>
    doT(mutMonad<S>())
        .addM("table", readMutRef(table))
        .finish(({ table }): never[] => {
            if (table.keys.length === 0) {
                // return initial size
                const INITIAL_CAPACITY = 8;
                table.len = 0;
                table.controls = new Uint8Array(INITIAL_CAPACITY);
                table.keys = new Array(INITIAL_CAPACITY);
                table.values = new Array(INITIAL_CAPACITY);
                return [];
            }
            // extends entries length
            const controls = new Uint8Array(table.controls.length * 2);
            const keys: K[] = new Array(table.keys.length * 2);
            const values: V[] = new Array(table.values.length * 2);
            let len = 0;
            // and then rehash
            for (const [key, value] of findAll(controlsToMask(full), table)) {
                const pos =
                    keyToStartIndex(key, hash, table.hasher) % keys.length;
                controls[pos] = full;
                keys[pos] = key;
                values[pos] = value;
                ++len;
            }
            table.len = len;
            table.controls = controls;
            table.keys = keys;
            table.values = values;
            return [];
        });

export const write = <S, K, V>(
    key: K,
    value: V,
    hash: Hash<K>,
    tableRef: MutRef<S, Table<K, V>>,
): Mut<S, Option.Option<V>> =>
    doT(mutMonad<S>())
        .addM("table", readMutRef(tableRef))
        .runWith(({ table }) => {
            if (table.len >= table.keys.length * LOAD_FACTOR) {
                return extend(hash, tableRef);
            } else {
                return mutMonad<S>().pure([]);
            }
        })
        .finish(({ table }): Option.Option<V> => {
            const posOpt = find(
                key,
                controlsToMask(empty, tombstone, full),
                hash,
                table,
            );
            if (Option.isNone(posOpt)) {
                return Option.none();
            }

            const pos = Option.unwrap(posOpt);
            switch (table.controls[pos]!) {
                case empty:
                case tombstone:
                    table.len += 1;
                    table.controls[pos] = full;
                    table.keys[pos] = key;
                    table.values[pos] = value;
                    return Option.none();
                case full: {
                    const oldValue = table.values[pos]!;
                    table.values[pos] = value;
                    return Option.some(oldValue);
                }
                default:
                    throw new Error("unreachable");
            }
        });

export const erase = <S, K, V>(
    key: K,
    hash: Hash<K>,
    table: MutRef<S, Table<K, V>>,
): Mut<S, Option.Option<V>> =>
    doT(mutMonad<S>())
        .addM("table", readMutRef(table))
        .finish(({ table }): Option.Option<V> => {
            if (table.len <= 0) {
                return Option.none();
            }

            const posOpt = find(key, controlsToMask(full), hash, table);
            if (Option.isNone(posOpt)) {
                return Option.none();
            }

            const pos = Option.unwrap(posOpt);
            table.len -= 1;
            table.controls[pos] = tombstone;
            return Option.some(table.values[pos]!);
        });
