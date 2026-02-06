/**
 * This module provides a representation of range data.
 *
 * @packageDocumentation
 * @module
 */

import { isLe, isLt, type PartialOrd } from "./type-class/partial-ord.js";

/**
 * A symbol for included kind of `Bound`.
 */
export const includedNominal = Symbol("BoundIncluded");
/**
 * A symbol for excluded kind of `Bound`.
 */
export const excludedNominal = Symbol("BoundExcluded");
/**
 * A symbol for unbounded kind of `Bound`.
 */
export const unboundedNominal = Symbol("BoundUnbounded");

/**
 * An inclusive bound endpoint.
 */
export type Included<T> = [type: typeof includedNominal, point: T];

/**
 * An exclusive bound.
 */
export type Excluded<T> = [type: typeof excludedNominal, point: T];

/**
 * An infinite endpoint.
 */
export type Unbounded = [type: typeof unboundedNominal];

/**
 * An endpoint of a range of keys.
 */
export type Bound<T> = Included<T> | Excluded<T> | Unbounded;

/**
 * Determines `bound` is an `Included<T>`.
 */
export const isIncluded = <T>(bound: Bound<T>): bound is Included<T> =>
    bound[0] === includedNominal;
/**
 * Determines `bound` is an `Excluded<T>`.
 */
export const isExcluded = <T>(bound: Bound<T>): bound is Excluded<T> =>
    bound[0] === excludedNominal;
/**
 * Determines `bound` is an `Unbounded`.
 */
export const isUnbounded = <T>(bound: Bound<T>): bound is Unbounded =>
    bound[0] === unboundedNominal;

/**
 * A generic range with `Bound`s of start and end.
 */
export interface RangeBounds<T> {
    /**
     * The starting endpoint of the range.
     */
    readonly start: Bound<T>;
    /**
     * The ending endpoint of the range.
     */
    readonly end: Bound<T>;
}

/**
 * Creates a range from `start` (inclusive) to `end` (exclusive).
 *
 * @param start - Inclusive starting endpoint.
 * @param end - Exclusive ending endpoint.
 * @returns The range `start..end`.
 */
export const fromTo = <T>(start: T, end: T): RangeBounds<T> => ({
    start: [includedNominal, start],
    end: [excludedNominal, end],
});
/**
 * Creates a range from `start` (inclusive) to `end` (inclusive).
 *
 * @param start - Inclusive starting endpoint.
 * @param end - Inclusive ending endpoint.
 * @returns The range `start..=end`.
 */
export const fromToInclusive = <T>(start: T, end: T): RangeBounds<T> => ({
    start: [includedNominal, start],
    end: [includedNominal, end],
});
/**
 * Creates a range from `start` (inclusive) to infinite.
 *
 * @param start - Inclusive starting endpoint.
 * @returns The range `start..`.
 */
export const since = <T>(start: T): RangeBounds<T> => ({
    start: [includedNominal, start],
    end: [unboundedNominal],
});
/**
 * Creates a range from negative infinite to `end` (exclusive).
 *
 * @param end - Exclusive ending endpoint.
 * @returns The range `..end`.
 */
export const until = <T>(end: T): RangeBounds<T> => ({
    start: [unboundedNominal],
    end: [excludedNominal, end],
});
/**
 * Creates a range from negative infinite to `end` (inclusive).
 *
 * @param end - Inclusive ending endpoint.
 * @returns The range `..=end`.
 */
export const untilInclusive = <T>(end: T): RangeBounds<T> => ({
    start: [unboundedNominal],
    end: [includedNominal, end],
});
/**
 * Creates an infinite full range.
 *
 * @returns The range `..`.
 */
export const full = <T>(): RangeBounds<T> => ({
    start: [unboundedNominal],
    end: [unboundedNominal],
});

/**
 * Gets the starting endpoint from the range.
 *
 * @param range - For getting the `start`.
 * @returns The `start` of `range`.
 */
export const start = <T>({ start }: RangeBounds<T>): Bound<T> => start;
/**
 * Gets the ending endpoint from the range.
 *
 * @param range - For getting the `end`.
 * @returns The `end` of `range`.
 */
export const end = <T>({ end }: RangeBounds<T>): Bound<T> => end;

/**
 * Determines whether the range contains the item.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param item - To be checked.
 * @param range - To check.
 * @returns Whether `item` is contained in `range`.
 */
export const contains =
    <T>(ord: PartialOrd<T>) =>
    (item: T) =>
    (range: RangeBounds<T>): boolean =>
        (range.start[0] === includedNominal
            ? isLe(ord)(range.start[1], item)
            : range.start[0] === excludedNominal
              ? isLt(ord)(range.start[1], item)
              : true) &&
        (range.end[0] === includedNominal
            ? isLe(ord)(item, range.end[1])
            : range.end[0] === excludedNominal
              ? isLt(ord)(item, range.end[1])
              : true);
/**
 * Checks whether the `range` is empty, contains no value.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param range - To be checked.
 * @returns Whether `range` contains no value.
 */
export const isEmpty =
    <T>(ord: PartialOrd<T>) =>
    (range: RangeBounds<T>): boolean =>
        !(
            range.start[0] === unboundedNominal ||
            range.end[0] === unboundedNominal ||
            (range.start[0] === includedNominal &&
                range.end[0] === includedNominal &&
                isLe(ord)(range.start[1], range.end[1])) ||
            isLt(ord)(range.start[1], range.end[1])
        );
