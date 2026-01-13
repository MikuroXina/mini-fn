/**
 * This modules provides a data structure `SegTree`, the implementation of Segment Tree. This allows you that finding the monoid sum for the range in `O(log n)` time complexity.
 *
 * @packageDocumentation
 * @module
 */

import { type Mut, type MutRef, modifyMutRef, newMutRef } from "./mut.js";
import type { Monoid } from "./type-class/monoid.js";

export type SegTreeInner<T> = {
    /**
     * Tree of items calculated by `monoid.combine`. It defaults to `monoid.identity`.
     *
     * At the element of `index`, the relationships are:
     *
     * - Parent: `Math.floor((index - 1) / 2)`,
     * - First child: `index * 2 + 1`,
     * - Second child: `index * 2 + 2`.
     */
    items: T[];
    /**
     * The length of source array.
     */
    srcLen: number;
    /**
     * The number of the actual stored items, or capacity. Primary data are stored from `items[size - 1]` to `items[size - 1 + srcLen]`.
     */
    actualLen: number;
    /**
     * The `Monoid` instance for `T`.
     */
    monoid: Monoid<T>;
};
/**
 * A segment tree, the data structure which can query the monoid sum of items and update an element in `O(log n)`.
 */
export type SegTree<T> = Readonly<SegTreeInner<T>>;

const parentOf = (index: number): number => Math.floor((index - 1) / 2);
const firstChildOf = (index: number): number => index * 2 + 1;
const secondChildOf = (index: number): number => index * 2 + 2;

const I32_MAX = 2147483649;
const MAX_LEN = (I32_MAX + 1) / 2;
const nextPowerOfTwo = (x: number): number => {
    if (x <= 0) {
        return 1;
    }
    if (MAX_LEN < x) {
        return MAX_LEN;
    }
    x = x | 0;
    --x;
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    x |= x >> 32;
    ++x;
    return x;
};

/**
 * Creates a new segment tree with the monoid instance for `T` and its length.
 *
 * @param monoid - The `Monoid` instance for `T`, you want to calculate quickly.
 * @param len - The length limit on inserting items after.
 * @returns The new segment tree.
 */
export const withLen =
    <T>(monoid: Monoid<T>) =>
    (len: number): SegTree<T> => {
        const size = nextPowerOfTwo(len);
        return {
            items: [...new Array(size * 2 - 1)].map(() => monoid.identity),
            srcLen: len,
            actualLen: size,
            monoid,
        };
    };

/**
 * Creates a new segment tree with the monoid instance for `T` and existing items.
 *
 * @param monoid - The `Monoid` instance for `T`, you want to calculate quickly.
 * @param items - The items to be stored.
 * @returns The new segment tree.
 */
export const withItems =
    <T>(monoid: Monoid<T>) =>
    (items: readonly T[]): SegTree<T> => {
        if (MAX_LEN < items.length) {
            throw new Error("too much items");
        }
        const size = nextPowerOfTwo(items.length);
        const caches = [...new Array(size * 2 - 1)]
            .map(() => monoid.identity)
            .toSpliced(size - 1, items.length, ...items);
        const go = (visiting: number) => {
            if (size - 1 <= visiting) {
                return;
            }
            const left = firstChildOf(visiting);
            go(left);
            const right = secondChildOf(visiting);
            go(right);
            caches[visiting] = monoid.combine(caches[left]!, caches[right]!);
        };
        go(0);
        return {
            items: caches,
            srcLen: items.length,
            actualLen: size,
            monoid,
        };
    };

/**
 * Calculates the monoid sum of items for the querying range between `start` (inclusive) and `end` (exclusive).
 *
 * @param start - The start index (inclusive) of the querying range.
 * @param end - The end index (exclusive) of the querying range.
 * @param tree - To be queried.
 * @returns The monoid sum of items for the querying range.
 */
export const query =
    (start: number) =>
    (end: number) =>
    <T>(tree: SegTree<T>): T => {
        const go = (
            visiting: number,
            lookingStart: number,
            lookingEnd: number,
        ): T => {
            if (lookingEnd <= start || end <= lookingStart) {
                // looking doesn't contain querying range
                return tree.monoid.identity;
            }
            if (start <= lookingStart && lookingEnd <= end) {
                // looking completely contains querying range
                return tree.items[visiting]!;
            }
            const mid =
                lookingStart + Math.floor((lookingEnd - lookingStart) / 2);
            const left = go(firstChildOf(visiting), lookingStart, mid);
            const right = go(secondChildOf(visiting), mid, lookingEnd);
            return tree.monoid.combine(left, right);
        };
        return go(0, 0, tree.actualLen);
    };

/**
 * Gets the element at the index.
 *
 * @param index - The index of items.
 * @param tree - To be queried.
 * @returns The stored item, or the identity of monoid if not found.
 */
export const get = (index: number): (<T>(tree: SegTree<T>) => T) =>
    query(index)(index + 1);

/**
 * Extracts the stored items from the segment tree.
 *
 * @param tree - To be extracted.
 * @returns The shallow copy of stored items.
 */
export const intoItems = <T>(tree: SegTree<T>): T[] =>
    tree.items.slice(tree.actualLen - 1, tree.actualLen - 1 + tree.srcLen);

/**
 * Makes the segment tree into the mutable reference on `Mut` environment.
 *
 * @param tree - To be transformed.
 * @returns The mutable variable reference on `Mut`.
 */
export const intoMut = <S, T>(
    tree: SegTree<T>,
): Mut<S, MutRef<S, SegTree<T>>> =>
    newMutRef({ ...tree, items: [...tree.items] });

/**
 * Clears the items in the segment tree on `Mut`.
 *
 * @param ref - The reference to a segment tree.
 * @returns The clearing operation.
 */
export const clear = <S, T>(ref: MutRef<S, SegTree<T>>): Mut<S, never[]> =>
    modifyMutRef(ref)((tree) => {
        tree.items.fill(tree.monoid.identity);
        return tree;
    });

/**
 * Updates an item at `index` with `value` in the segment tree on `Mut`.
 *
 * @param ref - The reference to a segment tree.
 * @param index - The position index to insert the value.
 * @param value - To be inserted.
 * @returns The inserting operation.
 */
export const insert =
    <S, T>(ref: MutRef<S, SegTree<T>>) =>
    (index: number) =>
    (value: T): Mut<S, never[]> =>
        modifyMutRef(ref)((tree) => {
            index += tree.actualLen - 1;
            tree.items[index] = value;
            while (0 < index) {
                index = parentOf(index);
                tree.items[index] = tree.monoid.combine(
                    tree.items[firstChildOf(index)]!,
                    tree.items[secondChildOf(index)]!,
                );
            }
            return tree;
        });
