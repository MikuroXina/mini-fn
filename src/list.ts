import { cat } from "./cat.ts";
import type { Get1, Hkt1 } from "./hkt.ts";
import * as Option from "./option.ts";
import { isNone } from "./option.ts";
import { andThen, type Ordering } from "./ordering.ts";
import {
    type Decoder,
    decU32Be,
    encFoldable,
    flatMapDecoder,
    pureDecoder,
} from "./serial.ts";
import type { Tuple } from "./tuple.ts";
import { type Applicative, liftA2 } from "./type-class/applicative.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import type { Reduce } from "./type-class/reduce.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import type { Traversable } from "./type-class/traversable.ts";

/**
 * The list data type with current element and rest list of elements.
 */
export interface List<T> {
    readonly current: () => Option.Option<T>;
    readonly rest: () => List<T>;
}

export const partialEquality = <T>(equalityT: PartialEq<T>) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        (isNone(l.current()) && isNone(r.current())) ||
        (Option.partialEq(equalityT).eq(l.current(), r.current()) &&
            self(l.rest(), r.rest()));

    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <T>(equalityT: Eq<T>) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        (isNone(l.current()) && isNone(r.current())) ||
        (Option.eq(equalityT).eq(l.current(), r.current()) &&
            self(l.rest(), r.rest()));
    return self;
};
export const eq = fromEquality(equality);
export const partialCmp = <T>(order: PartialOrd<T>) => {
    const self = (l: List<T>, r: List<T>): Option.Option<Ordering> =>
        Option.andThen(() => self(l.rest(), r.rest()))(
            Option.partialOrd(order).partialCmp(l.current(), r.current()),
        );
    return self;
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <T>(order: Ord<T>) => {
    const self = (l: List<T>, r: List<T>): Ordering =>
        andThen(() => self(l.rest(), r.rest()))(
            Option.ord(order).cmp(l.current(), r.current()),
        );
    return self;
};
export const ord = fromCmp(cmp);

/**
 * Checks whether the list has a current element.
 *
 * @param list - The list to be checked.
 * @returns Whether the list has a current element.
 *
 * # Examples
 *
 * ```ts
 * import { empty, isNull, repeat } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(isNull(empty()), true);
 * assertEquals(isNull(repeat(0)), false);
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
 * import { successors, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iota = successors((x: number) => x + 1)(0);
 * const iter = toIterator(iota);
 * assertEquals(iter.next(), { value: 0, done: false });
 * assertEquals(iter.next(), { value: 1, done: false });
 * assertEquals(iter.next(), { value: 2, done: false });
 * assertEquals(iter.next(), { value: 3, done: false });
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
 * import { List, empty, unCons, singleton } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(unCons(empty()), Option.none());
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
 * import { successors, toIterator, map } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iota = successors((x: number) => x + 1)(0);
 * const mapped = toIterator(map((x: number) => x * 3 + 1)(iota));
 * assertEquals(mapped.next(), { value: 1, done: false });
 * assertEquals(mapped.next(), { value: 4, done: false });
 * assertEquals(mapped.next(), { value: 7, done: false });
 * assertEquals(mapped.next(), { value: 10, done: false });
 * ```
 */
export const map = <T, U>(f: (t: T) => U) => (list: List<T>): List<U> => ({
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
 * import { List, empty, plus, singleton, toIterator, unCons } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const singleZero = singleton(0);
 * const emptiness = empty<number>();
 *
 * const iter = toIterator(plus(singleZero)(singleZero));
 * assertEquals(iter.next(), { value: 0, done: false });
 * assertEquals(iter.next(), { value: 0, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * assertEquals(
 *     unCons(plus(singleZero)(emptiness)),
 *     Option.some([0, empty()] as [number, List<number>]),
 * );
 * assertEquals(
 *     unCons(plus(emptiness)(singleZero)),
 *     Option.some([0, empty()] as [number, List<number>]),
 * );
 * assertEquals(unCons(plus(emptiness)(emptiness)), Option.none());
 * ```
 */
export const plus = <T>(left: List<T>) => (right: List<T>): List<T> => {
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
 * import { List, appendToHead, singleton, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iter = toIterator(appendToHead(1)(singleton(4)));
 * assertEquals(iter.next(), { value: 1, done: false });
 * assertEquals(iter.next(), { value: 4, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * ```
 */
export const appendToHead = <T>(value: T) => (list: List<T>): List<T> => ({
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
 * import { appendToTail, singleton, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iter = toIterator(appendToTail(1)(singleton(4)));
 * assertEquals(iter.next(), { value: 4, done: false });
 * assertEquals(iter.next(), { value: 1, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * ```
 */
export const appendToTail = <T>(value: T) => (list: List<T>): List<T> => {
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
 * import { repeat, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iter = toIterator(repeat(13));
 * assertEquals(iter.next(), { value: 13, done: false });
 * assertEquals(iter.next(), { value: 13, done: false });
 * assertEquals(iter.next(), { value: 13, done: false });
 * assertEquals(iter.next(), { value: 13, done: false });
 * ```
 */
export const repeat = <T>(value: T) => repeatWith(() => value);

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
 * import { successors, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const iter = toIterator(successors((str: string) => str + "a")(""));
 * assertEquals(iter.next(), { value: "", done: false });
 * assertEquals(iter.next(), { value: "a", done: false });
 * assertEquals(iter.next(), { value: "aa", done: false });
 * assertEquals(iter.next(), { value: "aaa", done: false });
 * assertEquals(iter.next(), { value: "aaaa", done: false });
 * ```
 */
export const successors = <T>(succ: (t: T) => T) => (init: T): List<T> => ({
    current: () => Option.some(init),
    rest: () => successors(succ)(succ(init)),
});

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
 * import { range, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toArray(range(0, 5)), [0, 1, 2, 3, 4]);
 * assertEquals(toArray(range(0, 5, 0.5)), [
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
 * assertEquals(toArray(range(2, 3)), [2]);
 * assertEquals(toArray(range(3, 6)), [3, 4, 5]);
 * assertEquals(toArray(range(3, 3)), []);
 * assertEquals(toArray(range(5, 0)), []);
 * assertEquals(toArray(range(3, 2)), []);
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
 * import { digits, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toArray(digits(51413, 10)), [3, 1, 4, 1, 5]);
 * assertEquals(toArray(digits(0x51413, 16)), [3, 1, 4, 1, 5]);
 * assertEquals(toArray(digits(0o51413, 8)), [3, 1, 4, 1, 5]);
 * assertEquals(toArray(digits(0b1001011001, 2)), [
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
 * assertEquals(toArray(digits(0, 10)), []);
 * ```
 */
export const digits = (num: number, radix: number): List<number> => ({
    current: () => (num === 0 ? Option.none() : Option.some(num % radix)),
    rest: () => digits(Math.floor(num / radix), radix),
});

/**
 * Creates the list of characters of `string`.
 *
 * @param str - The source string.
 * @returns The list of characters.
 *
 * # Examples
 *
 * ```ts
 * import { fromString, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toArray(fromString("hoge")), ["h", "o", "g", "e"]);
 * assertEquals(toArray(fromString("")), []);
 * ```
 */
export const fromString = (str: string): List<string> => ({
    current: () =>
        Option.fromPredicate((x: string) => x !== "")(str.slice(0, 1)),
    rest: () => fromString(str.slice(1)),
});

/**
 * Creates the list of elements from `Array`.
 *
 * @param arr - The source array.
 * @returns The list of elements.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toArray(fromArray([2.81, 3.14, 1.58])), [2.81, 3.14, 1.58]);
 * assertEquals(toArray(fromArray([])), []);
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
 * import { empty, fromOption } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const listOf2 = fromOption(Option.some(2));
 * assertEquals(listOf2.current(), Option.some(2));
 * assertEquals(listOf2.rest(), empty());
 *
 * const listOfNone = fromOption(Option.none());
 * assertEquals(listOfNone.current(), Option.none());
 * assertEquals(listOfNone.rest(), empty());
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
    <F>(reduce: Reduce<F>) => <A>(fa: Get1<F, A>): List<A> =>
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
 * import { foldL, fromString } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
    <T, U>(f: (a: U) => (b: T) => U) => (init: U) => (list: List<T>): U => {
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
export const foldL1 = <T>(f: (a: T) => (b: T) => T) => (list: List<T>): T =>
    either<T>(() => {
        throw new Error("expected a list having one element at least");
    })((x: T, xs) => foldL(f)(x)(xs))(list);

/**
 * Folds the elements of list from right.
 *
 * @param f - The fold operation.
 * @param init - The initial value of the operation.
 * @param list - The target list.
 * @returns The folded value.
 *
 * # Examples
 *
 * ```ts
 * import { foldR, fromString } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
export const foldR = <T, U>(f: (a: T) => (b: U) => U) => (init: U) => {
    const go = (list: List<T>): U =>
        Option.mapOr(init)(([y, ys]: [T, List<T>]) => f(y)(go(ys)))(
            unCons(list),
        );
    return go;
};

/**
 * Folds the elements of list from right. The first value is used as an initial value. If `list` is null, it throws an error.
 *
 * @param f - The fold operation.
 * @param list - The target list.
 * @returns The folded value.
 */
export const foldR1 = <T>(f: (a: T) => (b: T) => T) => (list: List<T>): T =>
    either<T>(() => {
        throw new Error("expected a list having one element at least");
    })((x: T, xs) => foldR(f)(x)(xs))(list);

/**
 * Joins the list of string into a string.
 *
 * @param list - The list of string.
 * @returns The joined string.
 */
export const toString = foldL((a: string) => (b: string) => a + b)("");
/**
 * Counts elements in the list. If the list is infinite, it hangs forever.
 *
 * @param list - The finite list to count the length.
 * @returns The number of elements in the list.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromString, length, singleton } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(length(empty()), 0);
 * assertEquals(length(singleton(42)), 1);
 * assertEquals(length(fromString("foo")), 3);
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
 * import { concat, empty, fromArray, singleton, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const aList = singleton(42);
 * const bList = empty<number>();
 * const cList = fromArray([5, 4, 1, 2]);
 * const listList = fromArray([aList, bList, cList]);
 * assertEquals(toArray(concat(listList)), [42, 5, 4, 1, 2]);
 * ```
 */
export const concat = <T>(listList: List<List<T>>): List<T> =>
    build(
        <U>(c: (a: T) => (b: U) => U) => (n: U) =>
            foldR((x: List<T>) => (y: U) => foldR(c)(y)(x))(n)(listList),
    );

/**
 * Maps and flattens the list of list.
 *
 * @param fn - The mapper function.
 * @param list - The list to be mapped.
 * @returns The mapped list.
 */
export const concatMap =
    <T, U>(fn: (t: T) => List<U>) => (list: List<T>): List<U> =>
        build(
            <B>(c: (u: U) => (b: B) => B) => (n: B) =>
                foldR((x: T) => (b: B) => foldR(c)(b)(fn(x)))(n)(list),
        );

/**
 * The alias of `concatMap`.
 */
export const flatMap = concatMap;

/**
 * Scans the list from left. It is useful to make the partial sum list.
 *
 * @param f - The scanner for the adjacent elements.
 * @returns The scanned list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, scanL, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const aList = fromArray([1, 2, 2, 4, 4, 3]);
 * const partialSum = scanL((a: number) => (b: number) => a + b)(0)(aList);
 * assertEquals(toArray(partialSum), [0, 1, 3, 5, 9, 13, 16]);
 * ```
 */
export const scanL = <T, U>(f: (u: U) => (t: T) => U) =>
(init: U) =>
(
    src: List<T>,
): List<U> => {
    const res = [init];
    for (const t of toIterator(src)) {
        const next = f(res[res.length - 1])(t);
        res.push(next);
    }
    return fromArray(res);
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
 * import { empty, fromString, head, singleton } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(head(empty()), Option.none());
 * assertEquals(head(fromString("hoge")), Option.some("h"));
 *
 * const list = singleton(42);
 * assertEquals(head(list), Option.some(42));
 * assertEquals(head(list.rest()), Option.none());
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
 * import { empty, fromString, last, singleton } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(last(empty()), Option.none());
 * assertEquals(last(fromString("hoge")), Option.some("e"));
 *
 * const list = singleton(42);
 * assertEquals(last(list), Option.some(42));
 * assertEquals(last(list.rest()), Option.none());
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
 * import { empty, fromArray, fromString, reverse, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(reverse(empty()), empty());
 * assertEquals(toArray(reverse(fromArray([1, 4, 2, 3]))), [3, 2, 4, 1]);
 * assertEquals(toArray(reverse(fromString("hoge"))), ["e", "g", "o", "h"]);
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
 * import { empty, fromArray, init, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(init(empty()), empty());
 *
 * assertEquals(toArray(init(fromArray([5, 2, 1, 3]))), [5, 2, 1]);
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
 * import { empty, fromArray, toArray, zip } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
    <T>(aList: List<T>) => <U>(bList: List<U>): List<[T, U]> => ({
        current: () => Option.zip(aList.current())(bList.current()),
        rest: () => zip(aList.rest())(bList.rest()),
    });

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
 * import { empty, fromArray, toArray, zip3 } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
 * import { empty, fromArray, toArray, zip4 } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
                Option.isSome(a) && Option.isSome(b) && Option.isSome(c) &&
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
 * import { empty, fromArray, toArray, zipWith } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const aList = fromArray([1, 4, 2]);
 * const bList = fromArray([3, 5, 2]);
 *
 * const zipped = zipWith((a: number) => (b: number) => a * b)(aList)(bList);
 * assertEquals(toArray(zipped), [3, 20, 4]);
 * ```
 */
export const zipWith = <T, U, V>(
    zipper: (t: T) => (u: U) => V,
): (lList: List<T>) => (rList: List<U>) => List<V> => {
    const go = (lList: List<T>) => (rList: List<U>): List<V> => {
        const [l, r] = [lList.current(), rList.current()];
        if (Option.isNone(l) || Option.isNone(r)) {
            return empty();
        }
        return appendToHead(zipper(l[1])(r[1]))(go(lList.rest())(rList.rest()));
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
 * import { empty, fromArray, toArray, unzip } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const [aList, bList] = unzip(
 *     fromArray([
 *         [2, 3],
 *         [5, 4],
 *         [11, 3],
 *     ]),
 * );
 * assertEquals(toArray(aList), [2, 5, 11]);
 * assertEquals(toArray(bList), [3, 4, 3]);
 * ```
 */
export const unzip = <A, B>(list: List<[A, B]>): [List<A>, List<B>] =>
    foldR<[A, B], [List<A>, List<B>]>(([a, b]) => ([as, bs]) => [
        appendToHead(a)(as),
        appendToHead(b)(bs),
    ])([empty(), empty()])(list);

const prependToAll = <T>(sep: T) => (list: List<T>): List<T> =>
    either(() => list)(
        (x: T, xs) =>
            cat(xs).feed(prependToAll(sep)).feed(appendToHead(x)).feed(
                appendToHead(sep),
            )
                .value,
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
 * import { empty, fromString, intersperse, toString } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(intersperse(0)(empty()), empty());
 *
 * assertEquals(toString(intersperse(" ")(fromString("hoge"))), "h o g e");
 * ```
 */
export const intersperse = <T>(sep: T) => (list: List<T>): List<T> =>
    either(() => list)((x: T, xs) => appendToHead(x)(prependToAll(sep)(xs)))(
        list,
    );

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
 * import { empty, fromArray, fromString, intercalate, singleton, toString } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(intercalate(singleton(0))(empty()), empty());
 *
 * const joined = intercalate(fromString(", "))(
 *     fromArray([fromString("foo"), fromString("bar"), fromString("bee")]),
 * );
 * assertEquals(toString(joined), "foo, bar, bee");
 * ```
 */
export const intercalate =
    <T>(separator: List<T>) => (listList: List<List<T>>): List<T> =>
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
 * import { fromArray, transpose, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
        flatMap((list: List<T>): List<[T, List<T>]> =>
            fromOption(unCons(list))
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
export const interleaveTwoWay = <T>(xs: List<T>) => (ys: List<T>): List<T> =>
    interleave(fromArray([xs, ys]));

/**
 * Creates subsequences of the list except the empty pattern.
 *
 * @param list - The source list.
 * @returns The list of subsequences without the empty pattern.
 */
export const subsequencesExceptEmpty = <T>(list: List<T>): List<List<T>> =>
    either<List<List<T>>>(empty)((x: T, xs) => {
        const f = (ys: List<T>) => (r: List<List<T>>): List<List<T>> =>
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
 * import { fromArray, subsequences, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const subSeq = subsequences(fromArray([1, 2, 3, 4]));
 * const sequences = toArray(subSeq).map((seq) => toArray(seq));
 * assertEquals(sequences, [
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
    plus<List<T>>(empty())(subsequencesExceptEmpty(list));

/**
 * Creates permutations of the list.
 *
 * @param list - The source list.
 * @returns The list having permutations.
 *
 * # Examples
 *
 * ```ts
 * import { empty, fromArray, permutations, range, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(permutations(empty()), empty());
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

    const perms = <T>(tList: List<T>) => (uList: List<T>): List<List<T>> => {
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
                const [us, zs] = interleaveF((x) => f(appendToHead(y)(x)))(ys)(
                    r,
                );
                return [
                    appendToHead(y)(us),
                    appendToHead(f(appendToHead(t)(appendToHead(y)(us))))(zs),
                ];
            };
        const interleaveA =
            (xList: List<T>) => (r: List<List<T>>): List<List<T>> =>
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
 * import { unfoldR, toArray } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
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
 * Takes only the suffix of length `count`. If `count >= length(list)`, the list itself will be returned.
 *
 * @param count - The length to take.
 * @param list - The source list.
 * @returns The taken list.
 *
 * # Examples
 *
 * ```ts
 * import { range, take, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const taken = take(2)(range(1, 6));
 * const iter = toIterator(taken);
 * assertEquals(iter.next(), { value: 1, done: false });
 * assertEquals(iter.next(), { value: 2, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * ```
 */
export const take = (count: number) => <T>(list: List<T>): List<T> => {
    if (count <= 1) {
        return fromArray(Option.toArray(head(list)));
    }
    const curr = list.current();
    if (Option.isNone(curr)) {
        return list;
    }
    return appendToHead(curr[1])(take(count - 1)(list.rest()));
};

/**
 * Drops the suffix of length `count`. If `count >= length(list)`, the empty list will be returned.
 *
 * @param count - The length to drop.
 * @param list - The source list.
 * @returns The dropped list.
 *
 * # Examples
 *
 * ```ts
 * import { drop, range, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const dropped = drop(2)(range(1, 6));
 * const iter = toIterator(dropped);
 * assertEquals(iter.next(), { value: 3, done: false });
 * assertEquals(iter.next(), { value: 4, done: false });
 * assertEquals(iter.next(), { value: 5, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * ```
 */
export const drop = (count: number) => <T>(list: List<T>): List<T> => {
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
 * import { range, splitAt, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const [left, right] = splitAt(2)(range(1, 6));
 * assertEquals(toArray(left), [1, 2]);
 * assertEquals(toArray(right), [3, 4, 5]);
 * ```
 */
export const splitAt =
    (index: number) => <T>(list: List<T>): [List<T>, List<T>] => [
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
 * import { range, replicate, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const replicated = replicate(4)(42);
 * const iter = toIterator(replicated);
 * assertEquals(iter.next(), { value: 42, done: false });
 * assertEquals(iter.next(), { value: 42, done: false });
 * assertEquals(iter.next(), { value: 42, done: false });
 * assertEquals(iter.next(), { value: 42, done: false });
 * assertEquals(iter.next(), { value: undefined, done: true });
 * ```
 */
export const replicate = (count: number) => <T>(value: T): List<T> =>
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
 * import { atMay, range } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const nums = range(1, 6);
 * assertEquals(atMay(0)(nums), Option.some(1));
 * assertEquals(atMay(4)(nums), Option.some(5));
 * assertEquals(atMay(-1)(nums), Option.none());
 * assertEquals(atMay(5)(nums), Option.none());
 * ```
 */
export const atMay =
    (index: number) => <T>(list: List<T>): Option.Option<T> => {
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
 * import { findIndex, fromArray } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const list = fromArray([1, 4, 2, 3, 5]);
 *
 * assertEquals(findIndex((x: number) => 4 <= x)(list), Option.some(1));
 * assertEquals(findIndex((x: number) => 0 <= x)(list), Option.some(0));
 * assertEquals(findIndex((x: number) => 8 <= x)(list), Option.none());
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
export const elemIndex = <T>(equalityT: PartialEq<T>) => (target: T) =>
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
 * import { findIndices, fromArray } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const list = fromArray([1, 4, 2, 3, 5]);
 *
 * assertEquals(findIndices((x: number) => 4 <= x)(list), [1, 4]);
 * assertEquals(findIndices((x: number) => 0 <= x)(list), [0, 1, 2, 3, 4]);
 * assertEquals(findIndices((x: number) => 8 <= x)(list), []);
 * ```
 */
export const findIndices =
    <T>(pred: (value: T) => boolean) => (list: List<T>): number[] => {
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
/**
 * Finds the positions of element which equals to `target` in the list. If the list is infinite, this will hang forever.
 *
 * @param equalityT - The equality for `T`.
 * @param target - The element to find.
 * @returns The found positions.
 */
export const elemIndices = <T>(equalityT: PartialEq<T>) => (target: T) =>
    findIndices((value: T) => equalityT.eq(value, target));

/**
 * Takes while the element satisfies `pred`. If the element matches `pred`, the list will fuse at the element.
 *
 * @param pred - The condition to decide to stop the list.
 * @returns The filtered list.
 *
 * # Examples
 *
 * ```ts
 * import { range, takeWhile, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const nums = range(1, 100);
 * const takeWhileSquared = takeWhile((x: number) => x * x <= 20)(nums);
 * assertEquals(toArray(takeWhileSquared), [1, 2, 3, 4]);
 * ```
 */
export const takeWhile =
    <T>(pred: (t: T) => boolean) => (list: List<T>): List<T> => {
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
 * import { dropWhile, fromArray, toArray, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
    <T>(pred: (t: T) => boolean) => (list: List<T>): List<T> =>
        either<List<T>>(empty)((
            x: T,
            xs,
        ) => (pred(x) ? dropWhile(pred)(xs) : list))(list);

/**
 * Drops the largest suffix of the list in which `pred` holds for all elements of the suffix.
 *
 * @param pred - The condition to drop the suffix.
 * @returns The list dropped the matched suffix.
 *
 * # Examples
 *
 * ```ts
 * import { dropWhileEnd, fromArray, toArray, toIterator } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
): (list: List<T>) => List<T> =>
    foldR<T, List<T>>(
        (x) => (xs) => (pred(x) && isNull(xs) ? empty() : appendToHead(x)(xs)),
    )(
        empty(),
    );

/**
 * Splits the list into a tuple of the longest prefix satisfies `pred` and the rest. It is equivalent to `[takeWhile(pred)(list), dropWhile(pred)(list)]`.
 *
 * @param pred - The condition to split.
 * @returns The tuple of split of the list.
 *
 * # Examples
 *
 * ```ts
 * import { fromArray, span, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * {
 *     const [left, right] = span((x: number) => x < 3)(
 *         fromArray([1, 2, 3, 4, 1, 2, 3, 4]),
 *     );
 *     assertEquals(toArray(left), [1, 2]);
 *     assertEquals(toArray(right), [3, 4, 1, 2, 3, 4]);
 * }
 * {
 *     const [left, right] = span((x: number) => x < 9)(fromArray([1, 2, 3]));
 *     assertEquals(toArray(left), [1, 2, 3]);
 *     assertEquals(toArray(right), []);
 * }
 * {
 *     const [left, right] = span((x: number) => x < 0)(fromArray([1, 2, 3]));
 *     assertEquals(toArray(left), []);
 *     assertEquals(toArray(right), [1, 2, 3]);
 * }
 * ```
 */
export const span =
    <T>(pred: (t: T) => boolean) => (list: List<T>): [List<T>, List<T>] =>
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
 * import { fromArray, spanNot, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * {
 *     const [left, right] = spanNot((x: number) => x > 3)(
 *         fromArray([1, 2, 3, 4, 1, 2, 3, 4]),
 *     );
 *     assertEquals(toArray(left), [1, 2, 3]);
 *     assertEquals(toArray(right), [4, 1, 2, 3, 4]);
 * }
 * {
 *     const [left, right] = spanNot((x: number) => x < 9)(
 *         fromArray([1, 2, 3]),
 *     );
 *     assertEquals(toArray(left), []);
 *     assertEquals(toArray(right), [1, 2, 3]);
 * }
 * {
 *     const [left, right] = spanNot((x: number) => x > 9)(
 *         fromArray([1, 2, 3]),
 *     );
 *     assertEquals(toArray(left), [1, 2, 3]);
 *     assertEquals(toArray(right), []);
 * }
 * ```
 */
export const spanNot = <T>(pred: (t: T) => boolean) => span((t: T) => !pred(t));

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
 * import { fromString, stripPrefix, toString } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 * import { strict } from "./type-class/partial-eq.ts";
 *
 * const stripFoo = stripPrefix(strict<string>())(fromString("foo"));
 *
 * {
 *     const optList = stripFoo(fromString("foobar"));
 *     const optStr = Option.map(toString)(optList);
 *     assertEquals(optStr, Option.some("bar"));
 * }
 * {
 *     const optList = stripFoo(fromString("foo"));
 *     const optStr = Option.map(toString)(optList);
 *     assertEquals(optStr, Option.some(""));
 * }
 * {
 *     const optList = stripFoo(fromString("barfoo"));
 *     const optStr = Option.map(toString)(optList);
 *     assertEquals(optStr, Option.none());
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
                    : Option.none()
            )(unCons(list))
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
): (list: List<T>) => List<List<T>> =>
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
 * import { fromString, group, toArray, toString } from "./list.ts";
 * import * as Option from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 * import { strict } from "./type-class/partial-eq.ts";
 *
 * const grouped = toArray(group(strict<string>())(fromString("Mississippi")))
 *     .map((list) => toString(list));
 * assertEquals(grouped, ["M", "i", "ss", "i", "ss", "i", "pp", "i"]);
 * ```
 */
export const group = <T>(
    equalityT: PartialEq<T>,
): (list: List<T>) => List<List<T>> =>
    groupBy((l) => (r) => equalityT.eq(l, r));

/**
 * Filters the list by `pred`. The elements which satisfy `pred` are only passed.
 *
 * @param pred - The condition to pick up an element.
 * @returns The filtered list.
 */
export const filter = <T>(
    pred: (element: T) => boolean,
): (list: List<T>) => List<T> =>
    flatMap((element) => (pred(element) ? singleton(element) : empty()));

/**
 * Extracts the diagonals from the two-dimensional list.
 *
 * @param listList - The two-dimensional list.
 * @returns The list of diagonal elements.
 */
export const diagonals = <T>(listList: List<List<T>>): List<List<T>> => {
    const go =
        (b: List<List<T>>) => (entries: List<List<T>>): List<List<T>> => {
            const ts = map((t: List<T>) => t.rest())(b);
            return appendToHead(
                flatMap((t: List<T>) => fromOption(t.current()))(b),
            )(
                either(() => transpose(ts))((e: List<T>, es: List<List<T>>) =>
                    go(appendToHead(e)(ts))(es)
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
    <A>(xs: List<A>) => <B>(ys: List<B>): List<Tuple<A, B>> =>
        cartesianProduct(
            (a: A) => (b: B): Tuple<A, B> => [a, b],
        )(xs)(ys);
/**
 * Applies the parameters to the functions with all combinations.
 *
 * @param fs - The list of function.
 * @param xs - The list of parameter.
 * @returns The applied values.
 */
export const applyCartesian =
    <A, B>(fs: List<(a: A) => B>) => (xs: List<A>): List<B> =>
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
 * import { fromArray, fromString, choices, range, toArray } from "./list.ts";
 * import { assertEquals } from "../deps.ts";
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
 * The instance of `Monad` for `List`.
 */
export const monad: Monad<ListHkt> = {
    pure: singleton,
    map,
    flatMap,
    apply: <T1, U1>(fns: List<(t: T1) => U1>) => (t: List<T1>): List<U1> =>
        concat(map((fn: (t: T1) => U1) => map(fn)(t))(fns)),
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
    traverse: <F>(app: Applicative<F>) =>
    <A, B>(
        visitor: (a: A) => Get1<F, B>,
    ): (list: List<A>) => Get1<F, List<B>> => {
        const consF = (x: A) => (ys: Get1<F, List<B>>): Get1<F, List<B>> =>
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

export const enc = () => encFoldable(foldable);
export const dec = <A>(decA: Decoder<A>): Decoder<List<A>> => {
    const go = (l: List<A>) => (lenToRead: number): Decoder<List<A>> =>
        lenToRead === 0
            ? pureDecoder(reverse(l))
            : flatMapDecoder((item: A) =>
                go(appendToHead(item)(l))(lenToRead - 1)
            )(decA);
    return flatMapDecoder(go(empty<A>()))(decU32Be());
};
