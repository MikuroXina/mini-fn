/**
 * This module provides a multi-set by the counting method.
 *
 * @packageDocumentation
 * @module
 */

import {
    mapMut,
    modifyMutRef,
    type Mut,
    type MutRef,
    newMutRef,
    readMutRef,
} from "./mut.ts";

export type MultiSetInner<T> = {
    /**
     * The numbers of items stored in. The count is always positive.
     */
    counts: Map<T, number>;
    /**
     * The total number of items stored in.
     */
    len: number;
};
/**
 * A multi-set by the counting method.
 */
export type MultiSet<T> = Readonly<MultiSetInner<T>>;

/**
 * Creates a new empty multi-set.
 *
 * @returns The new multi-set.
 */
export const empty = <T>(): MultiSet<T> => ({
    counts: new Map(),
    len: 0,
});

/**
 * Gets the length of items stored in the multi-set.
 *
 * @param set - To be queried.
 * @returns The number of items stored in.
 */
export const len = <T>(set: MultiSet<T>): number => set.len;

/**
 * Checks whether the item is stored in the multi-set.
 *
 * @param item - To check.
 * @param set - To be checked.
 * @returns Whether `items` is contained.
 */
export const contains = <T>(item: T) => (set: MultiSet<T>): boolean =>
    set.counts.has(item);

/**
 * Gets the number of `item`s stored in the multi-set.
 *
 * @param item - To query.
 * @param set - To be queried.
 * @returns The number of items stored.
 */
export const count = <T>(item: T) => (set: MultiSet<T>): number =>
    set.counts.get(item) ?? 0;

/**
 * Makes the multi-set into a mutable variable.
 *
 * @param set - Source data.
 * @returns The mutable multi-set in `Mut` environment.
 */
export const intoMut = <S, T>(
    set: MultiSet<T>,
): Mut<S, MutRef<S, MultiSetInner<T>>> =>
    newMutRef({
        counts: new Map(set.counts),
        len: set.len,
    });

/**
 * Inserts the item to the multi-set on `Mut`.
 *
 * @param item - To be inserted.
 * @param ref - The reference to a mutable multi-set.
 * @returns The inserting operation.
 */
export const insert =
    <T>(item: T) => <S>(ref: MutRef<S, MultiSetInner<T>>): Mut<S, never[]> =>
        modifyMutRef(ref)((set) => {
            if (set.counts.has(item)) {
                set.counts.set(item, set.counts.get(item)! + 1);
            } else {
                set.counts.set(item, 1);
            }
            set.len += 1;
            return set;
        });

/**
 * Removes the items from the multi-set on `Mut`.
 *
 * @param item - To be removed.
 * @param ref - The reference to a mutable multi-set.
 * @returns Whether removing succeeded.
 */
export const remove =
    <T>(item: T) => <S>(ref: MutRef<S, MultiSetInner<T>>): Mut<S, boolean> =>
        mapMut((set: MultiSetInner<T>) => {
            if (set.counts.get(item) === 1) {
                set.counts.delete(item);
                set.len -= 1;
                return true;
            }
            if (set.counts.has(item)) {
                set.counts.set(item, set.counts.get(item)! - 1);
                set.len -= 1;
                return true;
            }
            return false;
        })(readMutRef(ref));
