/**
 * `List` is a package for dealing with iterators.
 *
 * # Features
 *
 * `List` data structure represents the pair of current and rest items.
 *
 * There are many functions to use `List`s, so they are categorized here.
 *
 * ## Generators
 *
 * These functions generate a new list from some data:
 *
 * - `build` creates a list from an appending function.
 * - `digits` makes a number a list of digits.
 * - `empty` creates a list with no items.
 * - `iota` is an infinite list of integers.
 * - `range` creates a list of numbers for the right half-open interval.
 * - `repeat` creates an infinite list that repeats a value.
 * - `repeatWith` creates an infinite list that repeats to call a function.
 * - `replicate` creates a list that repeats a value specified times.
 * - `singleton` creates a list with the item.
 * - `singletonWith` creates a list with item from the function.
 * - `successors` creates an infinite list with mutating by the function.
 * - `unfoldR` creates a list with the builder function.
 *
 * These function convert from the data structure into a list:
 *
 * - `fromArray` converts from an `Array`.
 * - `fromIterable` converts from an `Iterable`.
 * - `fromOption` converts from an `Option`.
 * - `fromReduce` converts from a data structure that is an instance of `Reduce`.
 * - `fromString` converts from a `String`.
 *
 * These function convert from a list into the data structure:
 *
 * - `toArray` converts into an eager `Array` of items.
 * - `toIterator` converts a lazy `Iterator`.
 * - `toString` converts a list of `string`s by join method.
 *
 * ## Queries
 *
 * There are some functions to query the item in a list:
 *
 * - `atMay` gets the n-th item of list.
 * - `elemIndex` finds the index of matching element.
 * - `elemIndices` finds the indices of matching element.
 * - `findIndex` finds the index of element satisfies the predicate.
 * - `findIndices` finds the indices of element satisfies the predicate.
 * - `head` gets the first item of list.
 * - `isNull` returns whether the list is empty.
 * - `last` gets the last item of list.
 * - `length` finds the length of list.
 * - `tail` gets the items of list except the first.
 * - `unCons` decomposes the option having head item and rest items.
 *
 * ## Manipulators
 *
 * These functions operate a list of list:
 *
 * - `cartesianProduct` works with combinations from two lists.
 * - `choices` creates unsorted combinations from two lists.
 * - `concat` flattens a list of list.
 * - `concatMap` transforms a list into the list of list and flattens it.
 * - `diagonal` extracts the sequential diagonal from a two-dimensional list.
 * - `diagonals` leaves the sequential diagonal of a two-dimensional list.
 * - `enumerate` appends the indices.
 * - `group` unifies the equal adjacent elements.
 * - `groupBy` unifies the adjacent elements which satisfies the predicate.
 * - `intercalate` inserts items among each list of list.
 * - `interleave` transposes and flattens a two-dimensional list.
 * - `interleaveTwoWay` transposes and flattens two lists.
 * - `intersperse` joins lists with a separator.
 * - `permutations` creates a list of permutations.
 * - `subsequences` creates a list of subsequences.
 * - `subsequencesExceptEmpty`  creates a list of subsequences except the empty list.
 * - `transpose` transposes a two-dimensional list.
 * - `tupleCartesian` composes two lists into a list of tuple of combinations.
 * - `zip` composes two lists as a list of tuple.
 * - `zip3` composes three lists as a list of tuple.
 * - `zip4` composes four lists as a list of tuple.
 * - `zipWith` composes two lists as a list of item made by the function.
 *
 * These functions modify elements of list:
 *
 * - `apply` exhausts items of the list with applying each function of the list.
 * - `applyCartesian` applies the parameters to the functions with all combinations.
 * - `drop` ignores prefix items by the count.
 * - `dropWhile` ignores prefix items which satisfies the predicate.
 * - `dropWhileEnd` ignores suffix items which satisfies the predicate.
 * - `filter` passes only if the item satisfies the predicate.
 * - `flatMap` maps items of the list by the function and flattens it.
 * - `init` removes the last item of the list.
 * - `map` transforms items of the list by the function.
 * - `mapOption` transforms items of the list, or removes if the function returned a none.
 * - `reverse` reverses the list items.
 * - `stripPrefix` strips the matching prefix.
 * - `take` takes prefix items by the count.
 * - `takeWhile` takes prefix items while the item satisfies the predicate.
 *
 * These functions add elements to list:
 *
 * - `appendToHead` adds the item to the head of list.
 * - `appendToTail` adds the item to the tail of list.
 * - `plus` concatenates two lists.
 *
 * These functions decompose list into other ones:
 *
 * - `span` splits the list with the predicate.
 * - `spanNot` splits the list with the negative predicate.
 * - `splitAt` splits the list at the position.
 * - `unzip` decomposes the list of tuples into a tuple of lists.
 *
 * These functions fold values of list:
 *
 * - `either` transforms the list either the head value exists or not.
 * - `foldL` folds values of the list from the left-side with an initial value.
 * - `foldL1` folds values of the list from the left-side.
 * - `foldR` folds values of the list from the right-side with an initial value.
 * - `foldR1` folds values of the list from the right-side.
 * - `scanL` folds values of the list with leaving breadcrumbs.
 *
 * @packageDocumentation
 * @module
 */

import { cat } from "./cat.js";
import type { Get1, Hkt1 } from "./hkt.js";
import * as Option from "./option.js";
import { equal, type Ordering } from "./ordering.js";
import {
    type Decoder,
    decU32Be,
    type Encoder,
    encFoldable,
    flatMapDecoder,
    pureDecoder,
} from "./serial.js";
import type { Tuple } from "./tuple.js";
import { type Applicative, liftA2 } from "./type-class/applicative.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Foldable } from "./type-class/foldable.js";
import type { Functor } from "./type-class/functor.js";
import { defaultHasher, type Hash } from "./type-class/hash.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import {
    fromPartialEquality,
    type PartialEq,
    type PartialEqUnary,
} from "./type-class/partial-eq.js";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.js";
import type { Reduce } from "./type-class/reduce.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import type { Traversable } from "./type-class/traversable.js";

/**
 * The list data type with current element and rest list of elements.
 */
export type List<T> = {
    /**
     * @returns A current heading item of the list.
     */
    readonly current: () => Option.Option<T>;
    /**
     * @returns Rest items of the list.
     */
    readonly rest: () => List<T>;
};

export const partialEquality = <T>(
    equalityT: PartialEq<T>,
): ((l: List<T>, r: List<T>) => boolean) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        (Option.isNone(l.current()) && Option.isNone(r.current())) ||
        (Option.partialEq(equalityT).eq(l.current(), r.current()) &&
            self(l.rest(), r.rest()));

    return self;
};
export const partialEq: <T>(equalityT: PartialEq<T>) => PartialEq<List<T>> =
    fromPartialEquality(partialEquality);
export const equality = <T>(
    equalityT: Eq<T>,
): ((l: List<T>, r: List<T>) => boolean) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        (Option.isNone(l.current()) && Option.isNone(r.current())) ||
        (Option.eq(equalityT).eq(l.current(), r.current()) &&
            self(l.rest(), r.rest()));
    return self;
};
export const eq: <T>(equalityT: Eq<T>) => Eq<List<T>> = fromEquality(equality);
export const partialCmp =
    <T>(order: PartialOrd<T>) =>
    (l: List<T>, r: List<T>): Option.Option<Ordering> => {
        while (true) {
            const lCurr = l.current();
            const rCurr = r.current();
            if (Option.isNone(lCurr) && Option.isNone(rCurr)) {
                return Option.some(equal);
            }
            if (Option.isNone(lCurr) || Option.isNone(rCurr)) {
                return Option.partialCmp(order)(lCurr, rCurr);
            }
            const res = order.partialCmp(
                Option.unwrap(lCurr),
                Option.unwrap(rCurr),
            );
            if (Option.isNone(res) || Option.unwrap(res) !== equal) {
                return res;
            }
            l = l.rest();
            r = r.rest();
        }
    };
export const partialOrd: <T>(order: PartialOrd<T>) => PartialOrd<List<T>> =
    fromPartialCmp(partialCmp);
export const cmp =
    <T>(order: Ord<T>) =>
    (l: List<T>, r: List<T>): Ordering => {
        while (true) {
            const lCurr = l.current();
            const rCurr = r.current();
            if (Option.isNone(lCurr) && Option.isNone(rCurr)) {
                return equal;
            }
            if (Option.isNone(lCurr) || Option.isNone(rCurr)) {
                return Option.cmp(order)(lCurr, rCurr);
            }
            const res = order.cmp(Option.unwrap(lCurr), Option.unwrap(rCurr));
            if (res !== equal) {
                return res;
            }
            l = l.rest();
            r = r.rest();
        }
    };
export const ord: <T>(order: Ord<T>) => Ord<List<T>> = fromCmp(cmp);

export const partialEqUnary: PartialEqUnary<ListHkt> = {
    liftEq:
        <Lhs, Rhs>(equality: (l: Lhs, r: Rhs) => boolean) =>
        (l: List<Lhs>, r: List<Rhs>): boolean => {
            while (true) {
                const lCurr = l.current();
                const rCurr = r.current();
                if (Option.isNone(lCurr) && Option.isNone(rCurr)) {
                    return true;
                }
                if (Option.isNone(lCurr) || Option.isNone(rCurr)) {
                    return false;
                }
                if (!equality(Option.unwrap(lCurr), Option.unwrap(rCurr))) {
                    return false;
                }
                l = l.rest();
                r = r.rest();
            }
        },
};

/**
 * Checks whether the list has a current element.
 *
 * @param list - The list to be checked.
 * @returns Whether the list has a current element.
 *
 * # Examples
 *
 * ```ts
 * import { empty, isNull, repeat } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(isNull(empty())).toStrictEqual(true);
 * expect(isNull(repeat(0))).toStrictEqual(false);
 * ```
 */
export const isNull = <T>(list: List<T>): boolean =>
    Option.isNone(list.current());

/**
 * Converts the list into a `Generator` iterator.
 *
 * @param list - The list to be converted.
 * @returns The generator of elements.
 *
 * # Examples
 *
 * ```ts
 * import { iota, successors, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const iter = toIterator(iota);
 * expect(iter.next(), { value: 0).toStrictEqual(done: false });
 * expect(iter.next(), { value: 1).toStrictEqual(done: false });
 * expect(iter.next(), { value: 2).toStrictEqual(done: false });
 * expect(iter.next(), { value: 3).toStrictEqual(done: false });
 * ```
 */
export function* toIterator<T>(list: List<T>): Generator<T, void> {
    let rest = list;
    while (true) {
        const next = rest.current();
        if (Option.isNone(next)) {
            break;
        }
        yield next[1];
        rest = rest.rest();
    }
}

/**
 * Converts the list into an `Array`. If the list is infinite, this will occur an error.
 *
 * @param list - The list to be converted.
 * @returns The array of elements.
 */
export const toArray = <T>(list: List<T>): T[] => [...toIterator(list)];

/**
 * Makes the list into an `Option` having head and rest.
 *
 * @param list - The list to be un-constructed.
 * @returns The optional of the pair of head and rest.
 *
 * # Examples
 *
 * ```ts
 * import { List, empty, unCons, singleton } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * expect(unCons(empty())).toStrictEqual(Option.none());
 * assertEquals(
 *     unCons(singleton(42)),
 *     Option.some([42, empty()] as [number, List<number>]),
 * );
 * ```
 */
export const unCons = <T>(list: List<T>): Option.Option<[T, List<T>]> =>
    Option.map((curr: T): [T, List<T>] => [curr, list.rest()])(list.current());

/**
 * Transforms the list either the current value exists or not.
 *
 * @param def - The function to produce default value.
 * @param mapper - The function maps from head and rest.
 * @param list - The list to be transformed.
 * @returns The transformed value.
 */
export const either =
    <U>(def: () => U) =>
    <T>(mapper: (x: T, xs: List<T>) => U) =>
    (list: List<T>): U =>
        Option.mapOrElse(def)(([x, xs]: [T, List<T>]) => mapper(x, xs))(
            unCons(list),
        );

/**
 * Maps the function from `T` to `U` onto `List`.
 *
 * @param f - The function to be mapped.
 * @returns The function mapped on `List`.
 *
 * # Examples
 *
 * ```ts
 * import { iota, successors, toIterator, map } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const mapped = toIterator(map((x: number) => x * 3 + 1)(iota));
 * expect(mapped.next(), { value: 1).toStrictEqual(done: false });
 * expect(mapped.next(), { value: 4).toStrictEqual(done: false });
 * expect(mapped.next(), { value: 7).toStrictEqual(done: false });
 * expect(mapped.next(), { value: 10).toStrictEqual(done: false });
 * ```
 */
export const map =
    <T, U>(f: (t: T) => U) =>
    (list: List<T>): List<U> => ({
        current: () => Option.map(f)(list.current()),
        rest: () => map(f)(list.rest()),
    });

/**
 * Creates a new empty list.
 *
 * @returns The list with no elements.
 */
export const empty = <T>(): List<T> => ({ current: Option.none, rest: empty });
/**
 * Creates a list with one element from the specified function.
 *
 * @param value - The function returns an element of list.
 * @returns The list with one element.
 */
export const singletonWith = <T>(value: () => T): List<T> => ({
    current: () => Option.some(value()),
    rest: empty,
});
/**
 * Creates a list with one specified element.
 *
 * @param value - The element of list.
 * @returns The list with one element.
 */
export const singleton = <T>(value: T): List<T> => singletonWith(() => value);

/**
 * Creates a new list with a finite iterable object.
 *
 * @param iterable - The finite iterable object such as `Array` or `Map`.
 * @returns The list of items from the iterable.
 */
export const fromIterable = <T>(iterable: Iterable<T>): List<T> =>
    fromArray([...iterable]);

/**
 * Concatenates two lists.
 *
 * @param left - The left-side to concatenate.
 * @param right - The right-side to concatenate.
 * @returns The concatenated list.
 *
 * # Examples
 *
 * ```ts
 * import { List, empty, plus, singleton, toIterator, unCons } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const singleZero = singleton(0);
 * const emptiness = empty<number>();
 *
 * const iter = toIterator(plus(singleZero)(singleZero));
 * expect(iter.next(), { value: 0).toStrictEqual(done: false });
 * expect(iter.next(), { value: 0).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * assertEquals(
 *     unCons(plus(singleZero)(emptiness)),
 *     Option.some([0, empty()] as [number, List<number>]),
 * );
 * assertEquals(
 *     unCons(plus(emptiness)(singleZero)),
 *     Option.some([0, empty()] as [number, List<number>]),
 * );
 * expect(unCons(plus(emptiness)(emptiness))).toStrictEqual(Option.none());
 * ```
 */
export const plus =
    <T>(left: List<T>) =>
    (right: List<T>): List<T> => {
        if (Option.isNone(left.current())) {
            return right;
        }
        return {
            current: () => left.current(),
            rest: () => plus(left.rest())(right),
        };
    };

/**
 * Appends the element to head of the list.
 *
 * @param value - The value to be appended.
 * @returns The appended list.
 *
 * # Examples
 *
 * ```ts
 * import { List, appendToHead, singleton, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const iter = toIterator(appendToHead(1)(singleton(4)));
 * expect(iter.next(), { value: 1).toStrictEqual(done: false });
 * expect(iter.next(), { value: 4).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * ```
 */
export const appendToHead =
    <T>(value: T) =>
    (list: List<T>): List<T> => ({
        current: () => Option.some(value),
        rest: () => list,
    });

/**
 * Appends the element to tail of the list.
 *
 * @param value - The value to be appended.
 * @returns The appended list.
 *
 * # Examples
 *
 * ```ts
 * import { appendToTail, singleton, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const iter = toIterator(appendToTail(1)(singleton(4)));
 * expect(iter.next(), { value: 4).toStrictEqual(done: false });
 * expect(iter.next(), { value: 1).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * ```
 */
export const appendToTail =
    <T>(value: T) =>
    (list: List<T>): List<T> => {
        if (Option.isNone(list.current())) {
            return singleton(value);
        }
        return {
            current: list.current,
            rest: () => appendToTail(value)(list.rest()),
        };
    };

/**
 * Creates an infinite list with `elem()`.
 *
 * @param elem - The element generator.
 * @returns The infinite list with `elem()` element.
 */
export const repeatWith = <T>(elem: () => T): List<T> => ({
    current: () => Option.some(elem()),
    rest: () => repeatWith(elem),
});
/**
 * Creates an infinite list with `value`.
 *
 * @param value - The element generator.
 * @returns The infinite list with `value` element.
 *
 * # Examples
 *
 * ```ts
 * import { repeat, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const iter = toIterator(repeat(13));
 * expect(iter.next(), { value: 13).toStrictEqual(done: false });
 * expect(iter.next(), { value: 13).toStrictEqual(done: false });
 * expect(iter.next(), { value: 13).toStrictEqual(done: false });
 * expect(iter.next(), { value: 13).toStrictEqual(done: false });
 * ```
 */
export const repeat = <T>(value: T): List<T> => repeatWith(() => value);

/**
 * Creates an infinite list with mutating by `succ`.
 *
 * @param succ - The successor generator.
 * @param init - Th initial element.
 * @returns The infinite list with applying `init` to `succ`.
 *
 * # Examples
 *
 * ```ts
 * import { successors, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const iter = toIterator(successors((str: string) => str + "a")(""));
 * expect(iter.next(), { value: "").toStrictEqual(done: false });
 * expect(iter.next(), { value: "a").toStrictEqual(done: false });
 * expect(iter.next(), { value: "aa").toStrictEqual(done: false });
 * expect(iter.next(), { value: "aaa").toStrictEqual(done: false });
 * expect(iter.next(), { value: "aaaa").toStrictEqual(done: false });
 * ```
 */
export const successors =
    <T>(succ: (t: T) => T) =>
    (init: T): List<T> => ({
        current: () => Option.some(init),
        rest: () => successors(succ)(succ(init)),
    });

/**
 * The infinite list of integers that starts from zero.
 */
export const iota: List<number> = successors((x: number) => x + 1)(0);

/**
 * Creates the list of numbers from `start` to `end` with stepping, adding by `step`.
 *
 * @param start - The start of the range (inclusive).
 * @param end - The end of the range (exclusive).
 * @param step - The steps of the numbers. Defaults to 1. Setting `step` to `0` will make the list infinite.
 * @returns The list of numbers in the range.
 *
 * # Examples
 *
 * ```ts
 * import { range, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(toArray(range(0, 5)), [0, 1, 2, 3).toStrictEqual(4]);
 * expect(toArray(range(0, 5).toStrictEqual(0.5)), [
 *     0,
 *     0.5,
 *     1,
 *     1.5,
 *     2,
 *     2.5,
 *     3,
 *     3.5,
 *     4,
 *     4.5,
 * ]);
 * expect(toArray(range(2, 3))).toStrictEqual([2]);
 * expect(toArray(range(3, 6)), [3, 4).toStrictEqual(5]);
 * expect(toArray(range(3, 3))).toStrictEqual([]);
 * expect(toArray(range(5, 0))).toStrictEqual([]);
 * expect(toArray(range(3, 2))).toStrictEqual([]);
 * ```
 */
export const range = (start: number, end: number, step = 1): List<number> => ({
    current: () => Option.fromPredicate((x: number) => x < end)(start),
    rest: () => range(start + step, end, step),
});

/**
 * Extracts digits of the number.
 *
 * @param num - The number to extract digits.
 * @param radix - The radix of digit.
 * @returns The list of digits of the number.
 *
 * # Examples
 *
 * ```ts
 * import { digits, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(toArray(digits(51413, 10)), [3, 1, 4, 1).toStrictEqual(5]);
 * expect(toArray(digits(0x51413, 16)), [3, 1, 4, 1).toStrictEqual(5]);
 * expect(toArray(digits(0o51413, 8)), [3, 1, 4, 1).toStrictEqual(5]);
 * expect(toArray(digits(0b1001011001).toStrictEqual(2)), [
 *     1,
 *     0,
 *     0,
 *     1,
 *     1,
 *     0,
 *     1,
 *     0,
 *     0,
 *     1,
 * ]);
 *
 * expect(toArray(digits(0, 10))).toStrictEqual([]);
 * ```
 */
export const digits = (num: number, radix: number): List<number> => ({
    current: () => (num === 0 ? Option.none() : Option.some(num % radix)),
    rest: () => digits(Math.floor(num / radix), radix),
});

const segmenter = new Intl.Segmenter();

/**
 * Creates the list of characters of `string`.
 *
 * @param str - The source string.
 * @returns The list of characters.
 *
 * # Examples
 *
 * ```ts
 * import { fromString, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(toArray(fromString("hoge")), ["h", "o", "g").toStrictEqual("e"]);
 * expect(toArray(fromString(""))).toStrictEqual([]);
 * ```
 */
export const fromString = (str: string): List<string> =>
    map(({ segment }: Intl.SegmentData) => segment)(
        fromIterable(segmenter.segment(str)),
    );

/**
 * Creates the list of elements from `Array`.
 *
 * @param arr - The source array.
 * @returns The list of elements.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(toArray(fromArray([2.81, 3.14, 1.58])), [2.81, 3.14).toStrictEqual(1.58]);
 * expect(toArray(fromArray([]))).toStrictEqual([]);
 * ```
 */
export const fromArray = <T>(arr: readonly T[]): List<T> => ({
    current: () => (0 in arr ? Option.some(arr[0]) : Option.none()),
    rest: () => fromArray(arr.slice(1)),
});

/**
 * Converts `Option` into a list.
 *
 * @param opt - The source optional.
 * @returns The list of zero or one elements.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromOption } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const listOf2 = fromOption(Option.some(2));
 * expect(listOf2.current()).toStrictEqual(Option.some(2));
 * expect(listOf2.rest()).toStrictEqual(empty());
 *
 * const listOfNone = fromOption(Option.none());
 * expect(listOfNone.current()).toStrictEqual(Option.none());
 * expect(listOfNone.rest()).toStrictEqual(empty());
 * ```
 */
export const fromOption = <T>(opt: Option.Option<T>): List<T> => ({
    current: () => opt,
    rest: empty,
});

/**
 * Creates the list from an instance of `Reduce`.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The source instance of `F`.
 * @returns The reduction list.
 */
export const fromReduce =
    <F>(reduce: Reduce<F>) =>
    <A>(fa: Get1<F, A>): List<A> =>
        reduce.reduceR(appendToHead)(fa)(empty());

/**
 * Folds the elements of list from left.
 *
 * @param f - The fold operation.
 * @param init - The initial value of the operation.
 * @param list - The target list.
 * @returns The folded value.
 *
 * # Examples
 *
 * ```ts
 * import { foldL, fromString } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * assertEquals(
 *     foldL((x: string) => (y: string) => y + x)("")(fromString("hoge")),
 *     "egoh",
 * );
 * assertEquals(
 *     foldL((x: string) => (y: string) => y + x)("")(fromString("")),
 *     "",
 * );
 * ```
 */
export const foldL =
    <T, U>(f: (a: U) => (b: T) => U) =>
    (init: U) =>
    (list: List<T>): U => {
        let res = init;
        for (const t of toIterator(list)) {
            res = f(res)(t);
        }
        return res;
    };

/**
 * Folds the elements of list from left. The first value is used as an initial value. If `list` is null, it throws an error.
 *
 * @param f - The fold operation.
 * @param list - The target list.
 * @returns The folded value.
 */
export const foldL1 =
    <T>(f: (a: T) => (b: T) => T) =>
    (list: List<T>): T =>
        either<T>(() => {
            throw new Error("expected a list having one element at least");
        })((x: T, xs) => foldL(f)(x)(xs))(list);

/**
 * Folds the elements of list from right.
 *
 * Applying `foldR` to infinite structures usually doesn't terminate. But it may still terminate under one of the following conditions:
 *
 *   - the folding function is short-circuiting,
 *   - the folding function is lazy on its second argument.
 *
 * @param f - The fold operation.
 * @param init - The initial value of the operation.
 * @param list - The target list.
 * @returns The folded value.
 *
 * # Examples
 *
 * ```ts
 * import { foldR, fromString } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * assertEquals(
 *     foldR((x: string) => (y: string) => x + y)("")(fromString("hoge")),
 *     "hoge",
 * );
 * assertEquals(
 *     foldR((x: string) => (y: string) => y + x)("")(fromString("")),
 *     "",
 * );
 * ```
 */
export const foldR =
    <T, U>(f: (a: T) => (b: U) => U) =>
    (init: U) =>
    (list: List<T>): U => {
        const stack: T[] = [];
        while (true) {
            const curr = list.current();
            if (Option.isNone(curr)) {
                break;
            }
            stack.push(Option.unwrap(curr));
            list = list.rest();
        }
        let res = init;
        for (let i = stack.length - 1; 0 <= i; --i) {
            res = f(stack[i]!)(res);
        }
        return res;
    };

/**
 * Folds the elements of list from right. The first value is used as an initial value. If `list` is null, it throws an error.
 *
 * @param f - The fold operation.
 * @param list - The target list.
 * @returns The folded value.
 */
export const foldR1 =
    <T>(f: (a: T) => (b: T) => T) =>
    (list: List<T>): T =>
        Option.unwrap(
            foldR(
                (a: T) =>
                    (opt: Option.Option<T>): Option.Option<T> =>
                        Option.some(Option.mapOr(a)((b: T) => f(a)(b))(opt)),
            )(Option.none())(list),
        );

/**
 * Joins the list of string into a string.
 *
 * @param list - The list of string.
 * @returns The joined string.
 */
export const toString: (list: List<string>) => string = foldL(
    (a: string) => (b: string) => a + b,
)("");
/**
 * Counts elements in the list. If the list is infinite, it hangs forever.
 *
 * @param list - The finite list to count the length.
 * @returns The number of elements in the list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromString, length, singleton } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(length(empty())).toStrictEqual(0);
 * expect(length(singleton(42))).toStrictEqual(1);
 * expect(length(fromString("foo"))).toStrictEqual(3);
 * ```
 */
export const length = <T>(list: List<T>): number =>
    foldL((a: number) => () => a + 1)(0)(list);

/**
 * Creates the list from the builder.
 *
 * @param builder - The function receives `appendToHead` and `currentList` and returns the appended list.
 * @returns The built list.
 */
export const build = <A>(
    builder: <B>(appendToHead: (a: A) => (b: B) => B) => (currentList: B) => B,
): List<A> => builder(appendToHead)(empty());

/**
 * Flattens the list of list.
 *
 * @param listList - The list of list.
 * @returns The flattened list.
 *
 * # Examples
 *
 * ```ts
 * import { concat, empty, fromArray, singleton, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = singleton(42);
 * const bList = empty<number>();
 * const cList = fromArray([5, 4, 1, 2]);
 * const listList = fromArray([aList, bList, cList]);
 * expect(toArray(concat(listList)), [42, 5, 4, 1).toStrictEqual(2]);
 * ```
 */
export const concat = <T>(listList: List<List<T>>): List<T> =>
    build(
        <U>(c: (a: T) => (b: U) => U) =>
            (n: U) =>
                foldR((x: List<T>) => (y: U) => foldR(c)(y)(x))(n)(listList),
    );

/**
 * Maps over items of a list, but `fn` can return a `None` to remove the item.
 *
 * @param fn - A function to map the item.
 * @param list - Data to be mapped.
 * @returns The mapped new list.
 */
export const mapOption = <T, U>(
    fn: (item: T) => Option.Option<U>,
): ((list: List<T>) => List<U>) =>
    either(() => empty<U>())((x, xs) => {
        const rest = mapOption(fn)(xs);
        return Option.mapOr(rest)((item: U) => appendToHead(item)(rest))(fn(x));
    });

/**
 * Maps and flattens the list of list.
 *
 * @param fn - The mapper function.
 * @param list - The list to be mapped.
 * @returns The mapped list.
 */
export const concatMap =
    <T, U>(fn: (t: T) => List<U>) =>
    (list: List<T>): List<U> =>
        build(
            <B>(c: (u: U) => (b: B) => B) =>
                (n: B) =>
                    foldR((x: T) => (b: B) => foldR(c)(b)(fn(x)))(n)(list),
        );

/**
 * The alias of `concatMap`.
 */
export const flatMap = concatMap;

export const apply =
    <T, U>(fns: List<(t: T) => U>) =>
    (t: List<T>): List<U> =>
        concat(map((fn: (t: T) => U) => map(fn)(t))(fns));

/**
 * Scans the list from left. It is useful to make the partial sum list.
 *
 * @param f - The scanner for the adjacent elements.
 * @returns The scanned list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, scanL, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = fromArray([1, 2, 2, 4, 4, 3]);
 * const partialSum = scanL((a: number) => (b: number) => a + b)(0)(aList);
 * expect(toArray(partialSum), [0, 1, 3, 5, 9, 13).toStrictEqual(16]);
 * ```
 */
export const scanL = <T, U>(
    f: (u: U) => (t: T) => U,
): ((init: U) => (src: List<T>) => List<U>) => {
    const go =
        <T, U>(f: (u: U) => (t: T) => U) =>
        (init: U) =>
        (src: List<T>): List<U> => ({
            current: () => Option.some(init),
            rest: () =>
                Option.mapOr(empty<U>())(
                    ([x, xs]: [T, List<T>]): List<U> => go(f)(f(init)(x))(xs),
                )(unCons(src)),
        });
    return go(f);
};

/**
 * Gets the first element of the list.
 *
 * @param list - The source list.
 * @returns The first element of list if exists.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromString, head, singleton } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * expect(head(empty())).toStrictEqual(Option.none());
 * expect(head(fromString("hoge"))).toStrictEqual(Option.some("h"));
 *
 * const list = singleton(42);
 * expect(head(list)).toStrictEqual(Option.some(42));
 * expect(head(list.rest())).toStrictEqual(Option.none());
 * ```
 */
export const head = <T>(list: List<T>): Option.Option<T> => list.current();

/**
 * Gets the last element of the list. If the list is infinite, it hangs forever.
 *
 * @param list - The source list.
 * @returns The last element of list if exists.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromString, last, singleton } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * expect(last(empty())).toStrictEqual(Option.none());
 * expect(last(fromString("hoge"))).toStrictEqual(Option.some("e"));
 *
 * const list = singleton(42);
 * expect(last(list)).toStrictEqual(Option.some(42));
 * expect(last(list.rest())).toStrictEqual(Option.none());
 * ```
 */
export const last = <T>(list: List<T>): Option.Option<T> => {
    const first = list.current();
    if (Option.isNone(first)) {
        return first;
    }
    let rest = list;
    while (true) {
        const next = rest.rest();
        if (Option.isNone(next.current())) {
            return rest.current();
        }
        rest = next;
    }
};

/**
 * Gets the elements without the first from the list.
 *
 * @param list - The source list.
 * @returns The rest element of list.
 */
export const tail = <T>(list: List<T>): List<T> => list.rest();

/**
 * Reverses the list. If the list is infinite, it will hang forever.
 *
 * @param list - The source list.
 * @returns The reversed list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, fromString, reverse, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(reverse(empty())).toStrictEqual(empty());
 * expect(toArray(reverse(fromArray([1, 4, 2, 3]))), [3, 2, 4).toStrictEqual(1]);
 * expect(toArray(reverse(fromString("hoge"))), ["e", "g", "o").toStrictEqual("h"]);
 * ```
 */
export const reverse = <T>(list: List<T>): List<T> => {
    const curr = list.current();
    if (Option.isNone(curr)) {
        return list;
    }
    return appendToTail(curr[1])(reverse(list.rest()));
};

/**
 * Removes the last element from the list.
 *
 * @param list - The source list.
 * @returns The picked list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, init, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(init(empty())).toStrictEqual(empty());
 *
 * expect(toArray(init(fromArray([5, 2, 1, 3]))), [5, 2).toStrictEqual(1]);
 * ```
 */
export const init = <T>(list: List<T>): List<T> => reverse(tail(reverse(list)));

/**
 * Zips two lists as the list of tuple.
 *
 * @param aList - The left-side list.
 * @param bList - The right-side list.
 * @returns The zipped list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, toArray, zip } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = fromArray([1, 4, 2]);
 * const bList = fromArray([3, 5, 2]);
 *
 * assertEquals(toArray(zip(aList)(bList)), [
 *     [1, 3],
 *     [4, 5],
 *     [2, 2],
 * ]);
 * ```
 */
export const zip =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>): List<[T, U]> => ({
        current: () => Option.zip(aList.current())(bList.current()),
        rest: () => zip(aList.rest())(bList.rest()),
    });

/**
 * Appends the list of items to its index.
 *
 * @param items - The items list.
 * @returns The list with indices.
 */
export const enumerate: <T>(items: List<T>) => List<[index: number, T]> =
    zip(iota);

/**
 * Zips three lists as the list of tuple.
 *
 * @param aList - The left-side list.
 * @param bList - The middle list.
 * @param cList - The right-side list.
 * @returns The zipped list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, toArray, zip3 } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = fromArray([1, 4, 2]);
 * const bList = fromArray([3, 5, 2]);
 * const cList = fromArray([3, 8, 4, 7, 6]);
 *
 * assertEquals(toArray(zip3(aList)(bList)(cList)), [
 *     [1, 3, 3],
 *     [4, 5, 8],
 *     [2, 2, 4],
 * ]);
 * ```
 */
export const zip3 =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>) =>
    <V>(cList: List<V>): List<[T, U, V]> => ({
        current: () => {
            const [a, b, c] = [
                aList.current(),
                bList.current(),
                cList.current(),
            ];
            if (Option.isSome(a) && Option.isSome(b) && Option.isSome(c)) {
                return Option.some([a[1], b[1], c[1]]);
            }
            return Option.none();
        },
        rest: () => zip3(aList.rest())(bList.rest())(cList.rest()),
    });
/**
 * Zips four lists as the list of tuple.
 *
 * @param aList - The list used as the first element of tuple.
 * @param bList - The list used as the second element of tuple.
 * @param cList - The list used as the third element of tuple.
 * @param dList - The list used as the fourth element of tuple.
 * @returns The zipped list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, toArray, zip4 } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = fromArray([1, 4, 2]);
 * const bList = fromArray([3, 5, 2]);
 * const cList = fromArray([3, 8, 4, 7, 6]);
 * const dList = fromArray([6, 2, 9, 8]);
 *
 * assertEquals(toArray(zip4(aList)(bList)(cList)(dList)), [
 *     [1, 3, 3, 6],
 *     [4, 5, 8, 2],
 *     [2, 2, 4, 9],
 * ]);
 * ```
 */
export const zip4 =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>) =>
    <V>(cList: List<V>) =>
    <W>(dList: List<W>): List<[T, U, V, W]> => ({
        current: () => {
            const [a, b, c, d] = [
                aList.current(),
                bList.current(),
                cList.current(),
                dList.current(),
            ];
            if (
                Option.isSome(a) &&
                Option.isSome(b) &&
                Option.isSome(c) &&
                Option.isSome(d)
            ) {
                return Option.some([a[1], b[1], c[1], d[1]]);
            }
            return Option.none();
        },
        rest: () =>
            zip4(aList.rest())(bList.rest())(cList.rest())(dList.rest()),
    });

/**
 * Zips two lists by `zipper`. Or this lifts `zipper` onto `List`.
 *
 * @param aList - The left-side list.
 * @param bList - The right-side list.
 * @returns The zipped list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, toArray, zipWith } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const aList = fromArray([1, 4, 2]);
 * const bList = fromArray([3, 5, 2]);
 *
 * const zipped = zipWith((a: number) => (b: number) => a * b)(aList)(bList);
 * expect(toArray(zipped), [3, 20).toStrictEqual(4]);
 * ```
 */
export const zipWith = <T, U, V>(
    zipper: (t: T) => (u: U) => V,
): ((lList: List<T>) => (rList: List<U>) => List<V>) => {
    const go =
        (lList: List<T>) =>
        (rList: List<U>): List<V> => {
            const [l, r] = [lList.current(), rList.current()];
            if (Option.isNone(l) || Option.isNone(r)) {
                return empty();
            }
            return appendToHead(zipper(l[1])(r[1]))(
                go(lList.rest())(rList.rest()),
            );
        };
    return go;
};

/**
 * Unzips the list of tuple into the tuple of list.
 *
 * @param list - The list of tuple.
 * @returns The unzipped tuple.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, toArray, unzip } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const [aList, bList] = unzip(
 *     fromArray([
 *         [2, 3],
 *         [5, 4],
 *         [11, 3],
 *     ]),
 * );
 * expect(toArray(aList), [2, 5).toStrictEqual(11]);
 * expect(toArray(bList), [3, 4).toStrictEqual(3]);
 * ```
 */
export const unzip = <A, B>(list: List<[A, B]>): [List<A>, List<B>] =>
    foldR<[A, B], [List<A>, List<B>]>(([a, b]) => ([as, bs]) => [
        appendToHead(a)(as),
        appendToHead(b)(bs),
    ])([empty(), empty()])(list);

const prependToAll =
    <T>(sep: T) =>
    (list: List<T>): List<T> =>
        either(() => list)(
            (x: T, xs) =>
                cat(xs)
                    .feed(prependToAll(sep))
                    .feed(appendToHead(x))
                    .feed(appendToHead(sep)).value,
        )(list);
/**
 * Joins the `sep` separator among the elements of list.
 *
 * @param sep - The separator element.
 * @param list - The source list.
 * @returns The joined list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromString, intersperse, toString } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(intersperse(0)(empty())).toStrictEqual(empty());
 *
 * expect(toString(intersperse(" ")(fromString("hoge")))).toStrictEqual("h o g e");
 * ```
 */
export const intersperse =
    <T>(sep: T) =>
    (list: List<T>): List<T> =>
        either(() => list)((x: T, xs) =>
            appendToHead(x)(prependToAll(sep)(xs)),
        )(list);

/**
 * Joins `separator` items among each list of the list.
 *
 * @param separator - The separator element.
 * @param list - The source list of list.
 * @returns The joined list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, fromString, intercalate, singleton, toString } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(intercalate(singleton(0))(empty())).toStrictEqual(empty());
 *
 * const joined = intercalate(fromString(", "))(
 *     fromArray([fromString("foo"), fromString("bar"), fromString("bee")]),
 * );
 * expect(toString(joined), "foo, bar).toStrictEqual(bee");
 * ```
 */
export const intercalate =
    <T>(separator: List<T>) =>
    (listList: List<List<T>>): List<T> =>
        concat(intersperse(separator)(listList));

/**
 * Transposes the rows and columns. Passing an infinite list will hang forever.
 *
 * @param listList - The source list of list.
 * @returns The transposed list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, transpose, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const matrix = fromArray([fromArray([1, 2, 3]), fromArray([4, 5, 6])]);
 * const transposed = transpose(matrix);
 * const actual = toArray(transposed).map((col) => toArray(col));
 * assertEquals(actual, [
 *     [1, 4],
 *     [2, 5],
 *     [3, 6],
 * ]);
 * ```
 */
export const transpose = <T>(listList: List<List<T>>): List<List<T>> => {
    const xxsAndXss = unCons(listList);
    if (Option.isNone(xxsAndXss)) {
        return empty();
    }
    const [xxs, xss] = xxsAndXss[1];
    const xAndXs = unCons(xxs);
    if (Option.isNone(xAndXs)) {
        return transpose(xss);
    }
    const [x, xs] = xAndXs[1];
    const [hds, tls] = unzip(
        flatMap(
            (list: List<T>): List<[T, List<T>]> => fromOption(unCons(list)),
        )(xss),
    );
    const combine =
        (y: T) =>
        (h: List<T>) =>
        (ys: List<T>) =>
        (t: List<List<T>>): List<List<T>> =>
            appendToHead(appendToHead(y)(h))(transpose(appendToHead(ys)(t)));
    return combine(x)(hds)(xs)(tls);
};

/**
 * Picks up the elements from list by list. It is same as doing transpose and concatenate.
 *
 * @param listList - The list of list.
 * @returns The picked up list.
 */
export const interleave = <T>(listList: List<List<T>>): List<T> =>
    concat(transpose(listList));
/**
 * Picks up the elements from two lists by list. It is same as doing transpose and concatenate.
 *
 * @param xs - The first list.
 * @param ys - The second list.
 * @returns The picked up list.
 */
export const interleaveTwoWay =
    <T>(xs: List<T>) =>
    (ys: List<T>): List<T> =>
        interleave(fromArray([xs, ys]));

/**
 * Creates subsequences of the list except the empty pattern.
 *
 * @param list - The source list.
 * @returns The list of subsequences without the empty pattern.
 */
export const subsequencesExceptEmpty = <T>(list: List<T>): List<List<T>> =>
    either<List<List<T>>>(empty)((x: T, xs) => {
        const f =
            (ys: List<T>) =>
            (r: List<List<T>>): List<List<T>> =>
                appendToHead(ys)(appendToHead(appendToHead(x)(ys))(r));
        return appendToHead(singleton(x))(
            foldR(f)(empty())(subsequencesExceptEmpty(xs)),
        );
    })(list);
/**
 * Creates subsequences of the list.
 *
 * @param list - The source list.
 * @returns The list having subsequences.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, subsequences, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const subSeq = subsequences(fromArray([1, 2, 3, 4]));
 * const sequences = toArray(subSeq).map((seq) => toArray(seq));
 * assertEquals(sequences, [
 *     [],
 *     [1],
 *     [2],
 *     [1, 2],
 *     [3],
 *     [1, 3],
 *     [2, 3],
 *     [1, 2, 3],
 *     [4],
 *     [1, 4],
 *     [2, 4],
 *     [1, 2, 4],
 *     [3, 4],
 *     [1, 3, 4],
 *     [2, 3, 4],
 *     [1, 2, 3, 4],
 * ]);
 * ```
 */
export const subsequences = <T>(list: List<T>): List<List<T>> =>
    plus<List<T>>(singleton(empty()))(subsequencesExceptEmpty(list));

/**
 * Creates permutations of the list.
 *
 * @param list - The source list.
 * @returns The list having permutations.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, permutations, range, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * expect(permutations(empty())).toStrictEqual(empty());
 *
 * const subSeq = permutations(range(1, 5));
 * const sequences = toArray(subSeq).map((seq) => toArray(seq));
 * assertEquals(sequences, [
 *     [1, 2, 3, 4],
 *     [2, 1, 3, 4],
 *     [3, 2, 1, 4],
 *     [2, 3, 1, 4],
 *     [3, 1, 2, 4],
 *     [1, 3, 2, 4],
 *     [4, 3, 2, 1],
 *     [3, 4, 2, 1],
 *     [3, 2, 4, 1],
 *     [4, 2, 3, 1],
 *     [2, 4, 3, 1],
 *     [2, 3, 4, 1],
 *     [4, 1, 2, 3],
 *     [1, 4, 2, 3],
 *     [1, 2, 4, 3],
 *     [4, 2, 1, 3],
 *     [2, 4, 1, 3],
 *     [2, 1, 4, 3],
 *     [4, 1, 3, 2],
 *     [1, 4, 3, 2],
 *     [1, 3, 4, 2],
 *     [4, 3, 1, 2],
 *     [3, 4, 1, 2],
 *     [3, 1, 4, 2],
 * ]);
 * ```
 */
export const permutations = <A>(list: List<A>): List<List<A>> => {
    if (Option.isNone(list.current())) {
        return empty();
    }

    const perms =
        <T>(tList: List<T>) =>
        (uList: List<T>): List<List<T>> => {
            const tAndTs = unCons(tList);
            if (Option.isNone(tAndTs)) {
                return empty();
            }
            const [t, ts] = tAndTs[1];
            const interleaveF =
                (f: (a: List<T>) => List<T>) =>
                (yList: List<T>) =>
                (r: List<List<T>>): [List<T>, List<List<T>>] => {
                    const yAndYs = unCons(yList);
                    if (Option.isNone(yAndYs)) {
                        return [ts, r];
                    }

                    const [y, ys] = yAndYs[1];
                    const [us, zs] = interleaveF((x) => f(appendToHead(y)(x)))(
                        ys,
                    )(r);
                    return [
                        appendToHead(y)(us),
                        appendToHead(f(appendToHead(t)(appendToHead(y)(us))))(
                            zs,
                        ),
                    ];
                };
            const interleaveA =
                (xList: List<T>) =>
                (r: List<List<T>>): List<List<T>> =>
                    interleaveF((x) => x)(xList)(r)[1];
            return foldR(interleaveA)(perms(ts)(appendToHead(t)(uList)))(
                permutations(uList),
            );
        };
    return appendToHead(list)(perms(list)(empty()));
};

/**
 * Builds the list from `initial` value with `unfolder`. When `unfolder` returns `none`, the building will end.
 *
 * @param unfolder - The function takes the seed and returns the tuple of next element and seed. The seed will be used as the next seed in a recursive call.
 * @param initial - The initial seed value to be passed to `unfolder`.
 * @returns The built list.
 *
 * # Examples
 *
 * ```ts
 * import { unfoldR, toArray } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const decrement = (n: number): Option.Option<[number, number]> => {
 *     if (n == 0) {
 *         return Option.none();
 *     }
 *     return Option.some([n, n - 1]);
 * };
 *
 * assertEquals(toArray(unfoldR(decrement)(10)), [
 *     10,
 *     9,
 *     8,
 *     7,
 *     6,
 *     5,
 *     4,
 *     3,
 *     2,
 *     1,
 * ]);
 * ```
 */
export const unfoldR =
    <T, U>(unfolder: (u: U) => Option.Option<[T, U]>) =>
    (initial: U): List<T> =>
        build(<B>(c: (t: T) => (b: B) => B) => (n: B): B => {
            const go = (b: U): B => {
                const opt = unfolder(b);
                if (Option.isNone(opt)) {
                    return n;
                }
                const [a, next] = opt[1];
                return c(a)(go(next));
            };
            return go(initial);
        });

/**
 * Takes only the prefix of length `count`. If `count >= length(list)`, the list itself will be returned.
 *
 * @param count - The length to take.
 * @param list - The source list.
 * @returns The taken list.
 *
 * # Examples
 *
 * ```ts
 * import { range, take, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const taken = take(2)(range(1, 6));
 * const iter = toIterator(taken);
 * expect(iter.next(), { value: 1).toStrictEqual(done: false });
 * expect(iter.next(), { value: 2).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * ```
 */
export const take =
    (count: number) =>
    <T>(list: List<T>): List<T> => {
        if (count <= 0) {
            return empty();
        }
        if (count === 1) {
            return fromArray(Option.toArray(head(list)));
        }
        const curr = list.current();
        if (Option.isNone(curr)) {
            return list;
        }
        return appendToHead(curr[1])(take(count - 1)(list.rest()));
    };

/**
 * Drops the prefix of length `count`. If `count >= length(list)`, the empty list will be returned.
 *
 * @param count - The length to drop.
 * @param list - The source list.
 * @returns The dropped list.
 *
 * # Examples
 *
 * ```ts
 * import { drop, range, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const dropped = drop(2)(range(1, 6));
 * const iter = toIterator(dropped);
 * expect(iter.next(), { value: 3).toStrictEqual(done: false });
 * expect(iter.next(), { value: 4).toStrictEqual(done: false });
 * expect(iter.next(), { value: 5).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * ```
 */
export const drop =
    (count: number) =>
    <T>(list: List<T>): List<T> => {
        if (Option.isNone(list.current())) {
            return empty();
        }
        if (count <= 0) {
            return list;
        }
        if (count === 1) {
            return list.rest();
        }
        return drop(count - 1)(list.rest());
    };

/**
 * Splits one list into two at `index`.
 *
 * @param index - The boundary of split.
 * @param list - The list to be split.
 * @returns The tuple of split lists.
 *
 * # Examples
 *
 * ```ts
 * import { range, splitAt, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const [left, right] = splitAt(2)(range(1, 6));
 * expect(toArray(left), [1).toStrictEqual(2]);
 * expect(toArray(right), [3, 4).toStrictEqual(5]);
 * ```
 */
export const splitAt =
    (index: number) =>
    <T>(list: List<T>): [List<T>, List<T>] => [
        take(index)(list),
        drop(index)(list),
    ];

/**
 * Repeats `value` at `count` times as a list.
 *
 * @param count - The times to repeat.
 * @param value - The value to be repeated.
 * @returns The repeated list.
 *
 * # Examples
 *
 * ```ts
 * import { range, replicate, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const replicated = replicate(4)(42);
 * const iter = toIterator(replicated);
 * expect(iter.next(), { value: 42).toStrictEqual(done: false });
 * expect(iter.next(), { value: 42).toStrictEqual(done: false });
 * expect(iter.next(), { value: 42).toStrictEqual(done: false });
 * expect(iter.next(), { value: 42).toStrictEqual(done: false });
 * expect(iter.next(), { value: undefined).toStrictEqual(done: true });
 * ```
 */
export const replicate =
    (count: number) =>
    <T>(value: T): List<T> =>
        take(count)(repeat(value));

/**
 * Gets the value at `index`. It takes *O(n)*.
 *
 * @param index - The position from 0 to get.
 * @param list - The source list.
 * @returns The element if exists.
 *
 * # Examples
 *
 * ```ts
 * import { atMay, range } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const nums = range(1, 6);
 * expect(atMay(0)(nums)).toStrictEqual(Option.some(1));
 * expect(atMay(4)(nums)).toStrictEqual(Option.some(5));
 * expect(atMay(-1)(nums)).toStrictEqual(Option.none());
 * expect(atMay(5)(nums)).toStrictEqual(Option.none());
 * ```
 */
export const atMay =
    (index: number) =>
    <T>(list: List<T>): Option.Option<T> => {
        if (index < 0) {
            return Option.none();
        }
        return drop(index)(list).current();
    };

/**
 * Finds the position of element which satisfies `pred` in the list. If the list is infinite and the element is not found, this will hang forever.
 *
 * @param pred - The match condition of element to find.
 * @param list - The source list.
 * @returns The found position if exists.
 *
 * # Examples
 *
 * ```ts
 * import { findIndex, fromArray } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const list = fromArray([1, 4, 2, 3, 5]);
 *
 * expect(findIndex((x: number) => 4 <= x)(list)).toStrictEqual(Option.some(1));
 * expect(findIndex((x: number) => 0 <= x)(list)).toStrictEqual(Option.some(0));
 * expect(findIndex((x: number) => 8 <= x)(list)).toStrictEqual(Option.none());
 * ```
 */
export const findIndex =
    <T>(pred: (value: T) => boolean) =>
    (list: List<T>): Option.Option<number> => {
        let index = 0;
        for (const elem of toIterator(list)) {
            if (pred(elem)) {
                return Option.some(index);
            }
            index += 1;
        }
        return Option.none();
    };
/**
 * Finds the position of element which equals to `target` in the list. If the list is infinite and the element is not found, this will hang forever.
 *
 * @param equalityT - The equality for `T`.
 * @param target - The element to find.
 * @param list - The source list.
 * @returns The found position if exists.
 */
export const elemIndex =
    <T>(equalityT: PartialEq<T>) =>
    (target: T): ((list: List<T>) => Option.Option<number>) =>
        findIndex((value: T) => equalityT.eq(value, target));
/**
 * Finds the positions of element which satisfies `pred` in the list. If the list is infinite, this will hang forever.
 *
 * @param pred - The match condition of element to find.
 * @param list - The source list.
 * @returns The found positions.
 *
 * # Examples
 *
 * ```ts
 * import { findIndices, fromArray } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 *
 * const list = fromArray([1, 4, 2, 3, 5]);
 *
 * expect(findIndices((x: number) => 4 <= x)(list), [1).toStrictEqual(4]);
 * expect(findIndices((x: number) => 0 <= x)(list), [0, 1, 2, 3).toStrictEqual(4]);
 * expect(findIndices((x: number) => 8 <= x)(list)).toStrictEqual([]);
 * ```
 */
export const findIndices =
    <T>(pred: (value: T) => boolean) =>
    (list: List<T>): number[] => {
        const indices = [];
        let index = 0;
        for (const elem of toIterator(list)) {
            if (pred(elem)) {
                indices.push(index);
            }
            index += 1;
        }
        return indices;
    };
export const findIndicesLazy =
    <T>(pred: (value: T) => boolean) =>
    (list: List<T>): List<number> =>
        map(([i]: [index: number, T]) => i)(
            filter(([, item]: [index: number, T]) => pred(item))(
                enumerate(list),
            ),
        );
/**
 * Finds the positions of element which equals to `target` in the list. If the list is infinite, this will hang forever.
 *
 * @param equalityT - The equality for `T`.
 * @param target - The element to find.
 * @param list - Items to be searched.
 * @returns The found positions.
 */
export const elemIndices =
    <T>(equalityT: PartialEq<T>) =>
    (target: T): ((list: List<T>) => number[]) =>
        findIndices((value: T) => equalityT.eq(value, target));
export const elemIndicesLazy =
    <T>(equalityT: PartialEq<T>) =>
    (target: T): ((list: List<T>) => List<number>) =>
        findIndicesLazy((value: T) => equalityT.eq(value, target));

/**
 * Takes while the element satisfies `pred`. If the element matches `pred`, the list will fuse at the element.
 *
 * @param pred - The condition to decide to stop the list.
 * @returns The filtered list.
 *
 * # Examples
 *
 * ```ts
 * import { range, takeWhile, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const nums = range(1, 100);
 * const takeWhileSquared = takeWhile((x: number) => x * x <= 20)(nums);
 * expect(toArray(takeWhileSquared), [1, 2, 3).toStrictEqual(4]);
 * ```
 */
export const takeWhile =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): List<T> => {
        if (Option.mapOr(false)(pred)(list.current())) {
            return {
                current: list.current,
                rest: () => takeWhile(pred)(list.rest()),
            };
        }
        return empty();
    };

/**
 * Drops while the element satisfies `pred`. If the element does not match `pred`, the rest of elements are yielded.
 *
 * @param pred - The condition to decide to drop from the list.
 * @returns The filtered list.
 *
 * # Examples
 *
 * ```ts
 * import { dropWhile, fromArray, toArray, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * assertEquals([
 *     ...toIterator(
 *         dropWhile((x: number) => x < 3)(
 *             fromArray([1, 2, 3, 4, 5, 1, 2, 3]),
 *         ),
 *     ),
 * ], [3, 4, 5, 1, 2, 3]);
 * assertEquals(
 *     toArray(dropWhile((x: number) => x < 9)(fromArray([1, 2, 3]))),
 *     [],
 * );
 * assertEquals(
 *     toArray(dropWhile((x: number) => x < 0)(fromArray([1, 2, 3]))),
 *     [1, 2, 3],
 * );
 * ```
 */
export const dropWhile =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): List<T> =>
        either<List<T>>(empty)((x: T, xs) =>
            pred(x) ? dropWhile(pred)(xs) : list,
        )(list);

/**
 * Drops the largest suffix of the list in which `pred` holds for all elements of the suffix.
 *
 * @param pred - The condition to drop the suffix.
 * @returns The list dropped the matched suffix.
 *
 * # Examples
 *
 * ```ts
 * import { dropWhileEnd, fromArray, toArray, toIterator } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * assertEquals([
 *     ...toIterator(
 *         dropWhileEnd((x: number) => x < 3)(
 *             fromArray([1, 2, 3, 4, 5, 1, 2]),
 *         ),
 *     ),
 * ], [1, 2, 3, 4, 5]);
 * assertEquals(
 *     toArray(dropWhileEnd((x: number) => x < 9)(fromArray([1, 2, 3]))),
 *     [],
 * );
 * assertEquals(
 *     toArray(dropWhileEnd((x: number) => x < 0)(fromArray([1, 2, 3]))),
 *     [1, 2, 3],
 * );
 * ```
 */
export const dropWhileEnd = <T>(
    pred: (t: T) => boolean,
): ((list: List<T>) => List<T>) =>
    foldR<T, List<T>>(
        (x) => (xs) => (pred(x) && isNull(xs) ? empty() : appendToHead(x)(xs)),
    )(empty());

/**
 * Splits the list into a tuple of the longest prefix satisfies `pred` and the rest. It is equivalent to `[takeWhile(pred)(list), dropWhile(pred)(list)]`.
 *
 * @param pred - The condition to split.
 * @returns The tuple of split of the list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, span, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * {
 *     const [left, right] = span((x: number) => x < 3)(
 *         fromArray([1, 2, 3, 4, 1, 2, 3, 4]),
 *     );
 *     expect(toArray(left), [1).toStrictEqual(2]);
 *     expect(toArray(right), [3, 4, 1, 2, 3).toStrictEqual(4]);
 * }
 * {
 *     const [left, right] = span((x: number) => x < 9)(fromArray([1, 2, 3]));
 *     expect(toArray(left), [1, 2).toStrictEqual(3]);
 *     expect(toArray(right)).toStrictEqual([]);
 * }
 * {
 *     const [left, right] = span((x: number) => x < 0)(fromArray([1, 2, 3]));
 *     expect(toArray(left)).toStrictEqual([]);
 *     expect(toArray(right), [1, 2).toStrictEqual(3]);
 * }
 * ```
 */
export const span =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): [List<T>, List<T>] =>
        either<[List<T>, List<T>]>(() => [empty(), empty()])((x: T, xs) => {
            if (pred(x)) {
                const [ys, zs] = span(pred)(xs);
                return [appendToHead(x)(ys), zs];
            }
            return [empty(), list];
        })(list);

/**
 * Splits the list into a tuple of the longest prefix does *NOT* satisfy `pred` and the rest. It is equivalent to `span((item) => !pred(item))`.
 *
 * @param pred - The condition to split.
 * @returns The tuple of split of the list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, spanNot, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * {
 *     const [left, right] = spanNot((x: number) => x > 3)(
 *         fromArray([1, 2, 3, 4, 1, 2, 3, 4]),
 *     );
 *     expect(toArray(left), [1, 2).toStrictEqual(3]);
 *     expect(toArray(right), [4, 1, 2, 3).toStrictEqual(4]);
 * }
 * {
 *     const [left, right] = spanNot((x: number) => x < 9)(
 *         fromArray([1, 2, 3]),
 *     );
 *     expect(toArray(left)).toStrictEqual([]);
 *     expect(toArray(right), [1, 2).toStrictEqual(3]);
 * }
 * {
 *     const [left, right] = spanNot((x: number) => x > 9)(
 *         fromArray([1, 2, 3]),
 *     );
 *     expect(toArray(left), [1, 2).toStrictEqual(3]);
 *     expect(toArray(right)).toStrictEqual([]);
 * }
 * ```
 */
export const spanNot = <T>(
    pred: (t: T) => boolean,
): ((list: List<T>) => [List<T>, List<T>]) => span((t: T) => !pred(t));

/**
 * Strips `list` if matches `prefix`, otherwise returns `none`.
 *
 * @param equalityT - The equality for `T`.
 * @param prefix - The prefix to strip.
 * @param list - The source list.
 * @returns The stripped list.
 *
 * # Examples
 *
 * ```ts
 * import { fromString, stripPrefix, toString } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 * import { strict } from "./type-class/partial-eq.js";
 *
 * const stripFoo = stripPrefix(strict<string>())(fromString("foo"));
 *
 * {
 *     const optList = stripFoo(fromString("foobar"));
 *     const optStr = Option.map(toString)(optList);
 *     expect(optStr).toStrictEqual(Option.some("bar"));
 * }
 * {
 *     const optList = stripFoo(fromString("foo"));
 *     const optStr = Option.map(toString)(optList);
 *     expect(optStr).toStrictEqual(Option.some(""));
 * }
 * {
 *     const optList = stripFoo(fromString("barfoo"));
 *     const optStr = Option.map(toString)(optList);
 *     expect(optStr).toStrictEqual(Option.none());
 * }
 * ```
 */
export const stripPrefix =
    <T>(equalityT: PartialEq<T>) =>
    (prefix: List<T>) =>
    (list: List<T>): Option.Option<List<T>> =>
        either<Option.Option<List<T>>>(() => Option.some(list))((x: T, xs) =>
            Option.andThen(([y, ys]: [T, List<T>]) =>
                equalityT.eq(x, y)
                    ? stripPrefix<T>(equalityT)(xs)(ys)
                    : Option.none(),
            )(unCons(list)),
        )(prefix);

/**
 * Groups the list into sub-lists when adjacent elements are satisfy `pred`.
 *
 * @param pred - The condition to group.
 * @param list - The source list.
 * @returns The list of grouped sub-list.
 */
export const groupBy = <T>(
    pred: (l: T) => (r: T) => boolean,
): ((list: List<T>) => List<List<T>>) =>
    either<List<List<T>>>(empty)((x: T, xs): List<List<T>> => {
        const [ys, zs] = span(pred(x))(xs);
        return appendToHead(appendToHead(x)(ys))(groupBy(pred)(zs));
    });
/**
 * Groups the list into sub-lists when adjacent elements are equal.
 *
 * @param equalityT - The equality for `T`.
 * @param list - The source list.
 * @returns The list of grouped sub-list.
 *
 * # Examples
 *
 * ```ts
 * import { fromString, group, toArray, toString } from "./list.js";
 * import * as Option from "./option.js";
 * import { assertEquals } from "vitest";
 * import { strict } from "./type-class/partial-eq.js";
 *
 * const grouped = toArray(group(strict<string>())(fromString("Mississippi")))
 *     .map((list) => toString(list));
 * expect(grouped, ["M", "i", "ss", "i", "ss", "i", "pp").toStrictEqual("i"]);
 * ```
 */
export const group = <T>(
    equalityT: PartialEq<T>,
): ((list: List<T>) => List<List<T>>) =>
    groupBy((l) => (r) => equalityT.eq(l, r));

/**
 * Filters the list items from the head by `pred`. The elements which satisfy `pred` are only passed.
 *
 * @param pred - The condition to pick up an element.
 * @returns The filtered list.
 */
export const filter =
    <T>(pred: (element: T) => boolean) =>
    (list: List<T>): List<T> =>
        Option.mapOr(list)(
            ([x, xs]: [T, List<T>]): List<T> =>
                pred(x) ? appendToHead(x)(filter(pred)(xs)) : filter(pred)(xs),
        )(unCons(list));

/**
 * Removes duplicated elements by comparing the equality.
 *
 * @param equality - The condition to determine whether two items are same.
 * @param list - The list to be filtered.
 * @returns The filtered list.
 *
 * # Examples
 *
 * ```ts
 * import { fromIterable, toArray, unique } from "./list.js";
 * import { assertEquals } from "vitest";
 * import { nonNanHash } from "./type-class/hash.js";
 *
 * const uniqueNums = unique(nonNanHash)(fromIterable([1, 4, 2, 3, 5, 2, 3]));
 * expect(toArray(uniqueNums), [1, 4, 2, 3).toStrictEqual(5]);
 * ```
 */
export const unique = <T>(hasher: Hash<T>): ((list: List<T>) => List<T>) => {
    const known = new Map<bigint, T>();
    return filter((item: T) => {
        const hash = hasher.hash(item)(defaultHasher()).state();
        if (!known.has(hash)) {
            known.set(hash, item);
            return true;
        }
        return !hasher.eq(item, known.get(hash)!);
    });
};

/**
 * Extracts the diagonals from the two-dimensional list.
 *
 * @param listList - The two-dimensional list.
 * @returns The list of diagonal elements.
 */
export const diagonals = <T>(listList: List<List<T>>): List<List<T>> => {
    const go =
        (b: List<List<T>>) =>
        (entries: List<List<T>>): List<List<T>> => {
            const ts = map((t: List<T>) => t.rest())(b);
            return appendToHead(
                flatMap((t: List<T>) => fromOption(t.current()))(b),
            )(
                either(() => transpose(ts))((e: List<T>, es: List<List<T>>) =>
                    go(appendToHead(e)(ts))(es),
                )(entries),
            );
        };
    return tail(go(empty())(listList));
};
/**
 * Extracts the sequential diagonal from the two-dimensional list. It is equivalent to `concat(diagonals(listList))`.
 *
 * @param listList - The two-dimensional list.
 * @returns The sequential diagonal elements.
 */
export const diagonal = <T>(listList: List<List<T>>): List<T> =>
    concat(diagonals(listList));

/**
 * Creates the product of two lists with `f`. It is useful to exhaust value patterns of combinations.
 *
 * @param f - The function makes a product from two values.
 * @param xs - The left-side list.
 * @param ys - The right-side list.
 * @returns The list of products.
 */
export const cartesianProduct =
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    (xs: List<A>) =>
    (ys: List<B>): List<C> => {
        if (isNull(xs)) {
            return empty();
        }
        return diagonal(map((y: B) => map((x: A) => f(x)(y))(xs))(ys));
    };
/**
 * Creates the tuple of two lists. It is useful to exhaust value patterns of combinations.
 *
 * @param xs - The left-side list.
 * @param ys - The right-side list.
 * @returns The list of tuples.
 */
export const tupleCartesian =
    <A>(xs: List<A>) =>
    <B>(ys: List<B>): List<Tuple<A, B>> =>
        cartesianProduct(
            (a: A) =>
                (b: B): Tuple<A, B> => [a, b],
        )(xs)(ys);
/**
 * Applies the parameters to the functions with all combinations.
 *
 * @param fs - The list of function.
 * @param xs - The list of parameter.
 * @returns The applied values.
 */
export const applyCartesian =
    <A, B>(fs: List<(a: A) => B>) =>
    (xs: List<A>): List<B> =>
        cartesianProduct((f: (a: A) => B) => (a: A) => f(a))(fs)(xs);

/**
 * Creates a list such that whenever `v_i` has finite index in list `i` for each `i`, `[v_1, v_2, ..., v_n]` has finite index in the output list. It is different to cartesian product, so the order of elements are not sorted.
 *
 * @param listList - The finite list of (possibly infinite) list.
 * @returns The choose list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, fromString, choices, range, toArray } from "./list.js";
 * import { assertEquals } from "vitest";
 *
 * const choice = choices(fromArray([range(0, 3), range(3, 6)]));
 * const sequences = toArray(choice).map((seq) => toArray(seq));
 * assertEquals(sequences, [
 *     [0, 3],
 *     [0, 4],
 *     [1, 3],
 *     [0, 5],
 *     [1, 4],
 *     [2, 3],
 *     [1, 5],
 *     [2, 4],
 *     [2, 5],
 * ]);
 * ```
 */
export const choices = <T>(listList: List<List<T>>): List<List<T>> =>
    foldR(cartesianProduct(appendToHead))(singleton(empty<T>()))(listList);

export interface ListHkt extends Hkt1 {
    readonly type: List<this["arg1"]>;
}

/**
 * The instance of `Monoid` for concatenating `List<T>`.
 */
export const monoid = <T>(): Monoid<List<T>> => ({
    identity: empty(),
    combine: (l, r) => plus(l)(r),
    [semiGroupSymbol]: true,
});

/**
 * The instance of `Functor` for `List`.
 */
export const functor: Functor<ListHkt> = { map };

/**
 * The instance of `Applicative` for `List`.
 */
export const applicative: Applicative<ListHkt> = {
    pure: singleton,
    map,
    apply,
};

/**
 * The instance of `Monad` for `List`.
 */
export const monad: Monad<ListHkt> = {
    pure: singleton,
    map,
    flatMap,
    apply,
};

/**
 * The instance of `Foldable` for `List`.
 */
export const foldable: Foldable<ListHkt> = { foldR };

/**
 * The instance of `Traversable` for `List`.
 */
export const traversable: Traversable<ListHkt> = {
    map,
    foldR,
    traverse:
        <F>(app: Applicative<F>) =>
        <A, B>(
            visitor: (a: A) => Get1<F, B>,
        ): ((list: List<A>) => Get1<F, List<B>>) => {
            const consF =
                (x: A) =>
                (ys: Get1<F, List<B>>): Get1<F, List<B>> =>
                    liftA2(app)(appendToHead)(visitor(x))(ys);
            return foldR(consF)(app.pure(empty()));
        },
};

/**
 * The instance of `Reduce` for `List`.
 */
export const reduce: Reduce<ListHkt> = {
    reduceL: foldL,
    reduceR: (reducer) => (fa) => (b) => foldR(reducer)(b)(fa),
};

export const enc = <T>(encT: Encoder<T>): Encoder<List<T>> =>
    encFoldable(foldable)(encT);
export const dec = <A>(decA: Decoder<A>): Decoder<List<A>> => {
    const go =
        (l: List<A>) =>
        (lenToRead: number): Decoder<List<A>> =>
            lenToRead === 0
                ? pureDecoder(reverse(l))
                : flatMapDecoder((item: A) =>
                      go(appendToHead(item)(l))(lenToRead - 1),
                  )(decA);
    return flatMapDecoder(go(empty<A>()))(decU32Be());
};
