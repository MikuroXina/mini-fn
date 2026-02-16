import { doT } from "../cat.js";
import {
    type Mut,
    type MutRef,
    monad as mutMonad,
    readMutRef,
    writeMutRef,
} from "../mut.js";
import * as Option from "../option.js";
import * as Result from "../result.js";
import type { Hash, Hasher } from "../type-class/hash.js";

const LOAD_FACTOR = 0.875;

export const empty = (1 << 0) as 1;
export const sentinel = (1 << 1) as 2;
export const tombstone = (1 << 2) as 4;
export const full = (1 << 3) as 8;

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
): Result.Result<number, number> => {
    const pos = keyToStartIndex(key, hash, table.hasher) % table.keys.length;
    for (let i = 0; i < table.keys.length; ++i) {
        // linear probing
        const probedPos = (pos + i) % table.keys.length;
        if (
            (table.controls[probedPos]! & targetMask) !== 0 &&
            hash.eq(key, table.keys[probedPos]!)
        ) {
            return Result.ok(probedPos);
        }
        if (table.controls[probedPos]! === empty) {
            return Result.err(probedPos);
        }
    }
    throw new Error("out of memory");
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
                table.controls = new Uint8Array(INITIAL_CAPACITY).fill(empty);
                table.keys = new Array(INITIAL_CAPACITY);
                table.values = new Array(INITIAL_CAPACITY);
                return [];
            }
            // extends entries length
            const controls = new Uint8Array(table.controls.length * 2).fill(
                empty,
            );
            const keys: K[] = new Array(table.keys.length * 2);
            const values: V[] = new Array(table.values.length * 2);
            let len = 0;
            // and then rehash
            for (const [key, value] of findAll(controlsToMask(full), table)) {
                let pos =
                    keyToStartIndex(key, hash, table.hasher) % keys.length;
                while (controls[pos] === full) {
                    pos = (pos + 1) % keys.length;
                }
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
            const posRes = find(
                key,
                controlsToMask(empty, tombstone, full),
                hash,
                table,
            );
            const pos = Result.mergeOkErr(posRes);
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

            const posRes = find(key, controlsToMask(full), hash, table);
            if (Result.isErr(posRes)) {
                return Option.none();
            }

            const pos = Result.unwrap(posRes);
            table.len -= 1;
            table.controls[pos] = tombstone;
            return Option.some(table.values[pos]!);
        });

export const shrink = <S, K, V>(
    capacity: number,
    tableRef: MutRef<S, Table<K, V>>,
): Mut<S, never[]> =>
    doT(mutMonad<S>())
        .addM("table", readMutRef(tableRef))
        .finishM(({ table }) => {
            // replace new if it is empty
            if (
                table.controls.every(
                    (control) => control === empty || control === tombstone,
                )
            ) {
                return writeMutRef(tableRef)(newTable(table.hasher));
            }

            // otherwise truncate empty entries with maintaining the load factor
            const border = Math.ceil(capacity / LOAD_FACTOR);
            if (border >= table.controls.length) {
                return mutMonad<S>().pure([]);
            }
            const lastFullIndex = table.controls.lastIndexOf(full);
            if (lastFullIndex <= border) {
                return mutMonad<S>().pure([]);
            }
            table.controls = table.controls.slice(border, Infinity);
            table.keys.splice(border, Infinity);
            table.values.splice(border, Infinity);
            return mutMonad<S>().pure([]);
        });
