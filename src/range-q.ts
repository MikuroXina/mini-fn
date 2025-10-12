/**
 * This module provides a helper data structure that can find the group sum for a range in constant time.
 *
 * @packageDocumentation
 * @module
 */

import { type List, toIterator } from "./list.ts";
import type { Group } from "./type-class/group.ts";

/**
 * A helper data structure that can find the group sum for a range in constant time.
 */
export type RangeQ<T> = Readonly<{
    /**
     * The accumulating calculated items.
     */
    acc: readonly T[];
    /**
     * The `Group` instance for `T`.
     */
    group: Group<T>;
}>;

/**
 * Creates a new `RangeQ` from the `Group` instance and iterable sequence.
 *
 * @param group - A `Group` instance for `T`.
 * @param iterable - Source sequence of `T`.
 * @returns The new `RangeQ`.
 */
export const fromIterable =
    <T>(group: Group<T>) => (iterable: Iterable<T>): RangeQ<T> => ({
        acc: [...iterable].reduce<[T[], T]>(
            (prev, curr) => {
                const next = group.combine(prev[1], curr);
                return [[...prev[0], next], next] as [T[], T];
            },
            [[], group.identity],
        )[0],
        group,
    });

/**
 * Creates a new `RangeQ` from the `Group` instance and lazy list.
 *
 * @param group - A `Group` instance for `T`.
 * @param list - Source lazy list of `T`.
 * @returns The new `RangeQ`.
 */
export const fromList = <T>(group: Group<T>) => (list: List<T>): RangeQ<T> =>
    fromIterable(group)(toIterator(list));

/**
 * Gets the length of items from the `RangeQ`.
 *
 * @param range - To be queried.
 * @returns The number of items.
 */
export const len = <T>(range: RangeQ<T>): number => range.acc.length;

/**
 * Checks whether there are no items in the `RangeQ`.
 *
 * @param range - To be queried.
 * @returns Whether there are no items.
 */
export const isEmpty = <T>(range: RangeQ<T>): boolean => range.acc.length === 0;

/**
 * Sums up the elements for a range between `0` (inclusive) and `end` (exclusive). It takes only constant time (`O(1)`).
 *
 * @param end - The end index (exclusive).
 * @param range - To be queried.
 * @returns The group sum for the range.
 */
export const sumFromStartTo = (end: number) => <T>(range: RangeQ<T>): T =>
    (end <= 0 || range.acc.length === 0)
        ? range.group.identity
        : end >= range.acc.length
        ? range.acc[range.acc.length - 1]!
        : range.acc[end - 1]!;

/**
 * Sums up the elements for a range between `start` (inclusive) and `end` (exclusive). It takes only constant time (`O(1)`).
 *
 * @param start - The start index (inclusive).
 * @param end - The end index (exclusive).
 * @param range - To be queried.
 * @returns The group sum for the range.
 */
export const sum =
    (start: number) => (end: number) => <T>(range: RangeQ<T>): T =>
        start >= end ? range.group.identity : range.group.combine(
            range.group.invert(sumFromStartTo(start)(range)),
            sumFromStartTo(end)(range),
        );
