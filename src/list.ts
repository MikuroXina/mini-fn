import * as Cat from "./cat.js";
import type { Get1, Hkt1 } from "./hkt.js";
import * as Option from "./option.js";
import { Ordering, andThen } from "./ordering.js";
import type { Tuple } from "./tuple.js";
import { Applicative, liftA2 } from "./type-class/applicative.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";
import type { Reduce } from "./type-class/reduce.js";
import type { Traversable } from "./type-class/traversable.js";

/**
 * The list data type with current element and rest list of elements.
 */
export interface List<T> {
    readonly current: () => Option.Option<T>;
    readonly rest: () => List<T>;
}

export const partialEquality = <T>(equalityT: PartialEq<T>) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        Option.partialEq(equalityT).eq(l.current(), r.current()) && self(l.rest(), r.rest());
    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <T>(equalityT: Eq<T>) => {
    const self = (l: List<T>, r: List<T>): boolean =>
        Option.eq(equalityT).eq(l.current(), r.current()) && self(l.rest(), r.rest());
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
        andThen(() => self(l.rest(), r.rest()))(Option.ord(order).cmp(l.current(), r.current()));
    return self;
};
export const ord = fromCmp(cmp);

/**
 * Checks whether the list has a current element.
 *
 * @param list - The list to be checked.
 * @returns Whether the list has a current element.
 */
export const isNull = <T>(list: List<T>): boolean => Option.isNone(list.current());

/**
 * Converts the list into a `Generator` iterator.
 *
 * @param list - The list to be converted.
 * @returns The generator of elements.
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
        Option.mapOrElse(def)(([x, xs]: [T, List<T>]) => mapper(x, xs))(unCons(list));

/**
 * Maps the function from `T` to `U` onto `List`.
 *
 * @param f - The function to be mapped.
 * @returns The function mapped on `List`.
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
 * Concatenates two lists.
 *
 * @param left - The left-side to concatenate.
 * @param right - The right-side to concatenate.
 * @returns The concatenated list.
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
 */
export const repeat = <T>(value: T) => repeatWith(() => value);

/**
 * Creates an infinite list with mutating by `succ`.
 *
 * @param succ - The successor generator.
 * @param init - Th initial element.
 * @returns The infinite list with applying `init` to `succ`.
 */
export const successors =
    <T>(succ: (t: T) => T) =>
    (init: T): List<T> => ({
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
 */
export const fromString = (str: string): List<string> => ({
    current: () => Option.fromPredicate((x: string) => x !== "")(str.slice(0, 1)),
    rest: () => fromString(str.slice(1)),
});
/**
 * Creates the list of elements from `Array`.
 *
 * @param arr - The source array.
 * @returns The list of elements.
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
 * @param f - The fold operation.
 * @param init - The initial value of the operation.
 * @param list - The target list.
 * @returns The folded value.
 */
export const foldR =
    <T, U>(f: (a: T) => (b: U) => U) =>
    (init: U) => {
        const go = (list: List<T>): U =>
            Option.mapOr(init)(([y, ys]: [T, List<T>]) => f(y)(go(ys)))(unCons(list));
        return go;
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
 */
export const length = <T>(list: List<T>): number => foldL((a: number) => () => a + 1)(0)(list);

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
 */
export const concat = <T>(listList: List<List<T>>): List<T> =>
    build(
        <U>(c: (a: T) => (b: U) => U) =>
            (n: U) =>
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

/**
 * Scans the list from left. It is useful to make the partial sum list.
 *
 * ```ts
 * const aList = fromArray([1, 2, 2, 4, 4, 3]);
 * const partialSum = scanL((a: number) => (b: number) => a + b)(0)(aList)
 * expect(toArray(partialSum)).toEqual([0, 1, 3, 5, 9, 13, 16]);
 * ```
 *
 * @param f - The scanner for the adjacent elements.
 * @returns The scanned list.
 */
export const scanL =
    <T, U>(f: (u: U) => (t: T) => U) =>
    (init: U) =>
    (src: List<T>): List<U> => {
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
 */
export const head = <T>(list: List<T>): Option.Option<T> => list.current();
/**
 * Gets the last element of the list. If the list is infinite, it hangs forever.
 *
 * @param list - The source list.
 * @returns The last element of list if exists.
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
 * Reverses the list.
 *
 * @param list - The source list.
 * @returns The reversed list.
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
 */
export const init = <T>(list: List<T>): List<T> => reverse(tail(reverse(list)));

/**
 * Zips two lists as the list of tuple.
 *
 * @param aList - The left-side list.
 * @param bList - The right-side list.
 * @returns The zipped list.
 */
export const zip =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>): List<[T, U]> => ({
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
 */
export const zip3 =
    <T>(aList: List<T>) =>
    <U>(bList: List<U>) =>
    <V>(cList: List<V>): List<[T, U, V]> => ({
        current: () => {
            const [a, b, c] = [aList.current(), bList.current(), cList.current()];
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
            if (Option.isSome(a) && Option.isSome(b) && Option.isSome(c) && Option.isSome(d)) {
                return Option.some([a[1], b[1], c[1], d[1]]);
            }
            return Option.none();
        },
        rest: () => zip4(aList.rest())(bList.rest())(cList.rest())(dList.rest()),
    });

/**
 * Zips two lists by `zipper`. Or this lifts `zipper` onto `List`.
 *
 * @param aList - The left-side list.
 * @param bList - The right-side list.
 * @returns The zipped list.
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
            return appendToHead(zipper(l[1])(r[1]))(go(lList.rest())(rList.rest()));
        };
    return go;
};

/**
 * Unzips the list of tuple into the tuple of list.
 *
 * @param list - The list of tuple.
 * @returns The unzipped tuple.
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
                Cat.cat(xs).feed(prependToAll(sep)).feed(appendToHead(x)).feed(appendToHead(sep))
                    .value,
        )(list);
/**
 * Joins the `sep` separator among the elements of list.
 *
 * @param sep - The separator element.
 * @param list - The source list.
 * @returns The joined list.
 */
export const intersperse =
    <T>(sep: T) =>
    (list: List<T>): List<T> =>
        either(() => list)((x: T, xs) => appendToHead(x)(prependToAll(sep)(xs)))(list);
/**
 * Joins `separator` items among each list of the list.
 *
 * @param separator - The separator element.
 * @param list - The source list of list.
 * @returns The joined list.
 */
export const intercalate =
    <T>(separator: List<T>) =>
    (listList: List<List<T>>): List<T> =>
        concat(intersperse(separator)(listList));

/**
 * Transposes the rows and columns. Passing an infinite list will hang forever.
 *
 * ```ts
 * const matrix = fromArray([fromArray([1, 2, 3]), fromArray([4, 5, 6])]);
 * const transposed = transpose(matrix);
 * const actual = toArray(transposed).map((col) => toArray(col));
 * expect(actual).toEqual([
 *     [1, 4],
 *     [2, 5],
 *     [3, 6],
 * ]);
 * ```
 *
 * @param listList - The source list of list.
 * @returns The transposed list.
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
        flatMap((list: List<T>): List<[T, List<T>]> => fromOption(unCons(list)))(xss),
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
export const interleave = <T>(listList: List<List<T>>): List<T> => concat(transpose(listList));
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
        return appendToHead(singleton(x))(foldR(f)(empty())(subsequencesExceptEmpty(xs)));
    })(list);
/**
 * Creates subsequences of the list.
 *
 * ```ts
 * const subSeq = subsequences(fromArray([1, 2, 3, 4]));
 * const sequences = toArray(subSeq).map((seq) => toArray(seq));
 * expect(sequences).toEqual([
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
 *
 * @param list - The source list.
 * @returns The list having subsequences.
 */
export const subsequences = <T>(list: List<T>): List<List<T>> =>
    plus<List<T>>(empty())(subsequencesExceptEmpty(list));

/**
 * Creates permutations of the list.
 *
 * ```ts
 * const subSeq = permutations(range(1, 4));
 * const sequences = toArray(subSeq).map((seq) => toArray(seq));
 * expect(sequences).toEqual([
 *     [1, 2, 3],
 *     [2, 1, 3],
 *     [3, 2, 1],
 *     [2, 3, 1],
 *     [3, 1, 2],
 *     [1, 3, 2],
 * ]);
 * ```
 *
 * @param list - The source list.
 * @returns The list having permutations.
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
                    const [us, zs] = interleaveF((x) => f(appendToHead(y)(x)))(ys)(r);
                    return [
                        appendToHead(y)(us),
                        appendToHead(f(appendToHead(t)(appendToHead(y)(us))))(zs),
                    ];
                };
            const interleaveA =
                (xList: List<T>) =>
                (r: List<List<T>>): List<List<T>> =>
                    interleaveF((x) => x)(xList)(r)[1];
            return foldR(interleaveA)(perms(ts)(appendToHead(t)(uList)))(permutations(uList));
        };
    return appendToHead(list)(perms(list)(empty()));
};

/**
 * Builds the list from `initial` value with `unfolder`. When `unfolder` returns `none`, the building will end.
 *
 * @param unfolder - The function takes the seed and returns the tuple of next element and seed. The seed will be used as the next seed in a recursive call.
 * @param initial - The initial seed value to be passed to `unfolder`.
 * @returns The built list.
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
 */
export const take =
    (count: number) =>
    <T>(list: List<T>): List<T> => {
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
 * ```ts
 * const [left, right] = splitAt(2)(range(1, 6));
 * expect(toArray(left)).toEqual([1, 2]);
 * expect(toArray(right)).toEqual([3, 4, 5]);
 * ```
 *
 * @param index - The boundary of split.
 * @param list - The list to be split.
 * @returns The tuple of split lists.
 */
export const splitAt =
    (index: number) =>
    <T>(list: List<T>): [List<T>, List<T>] =>
        [take(index)(list), drop(index)(list)];

/**
 * Repeats `value` at `count` times as a list.
 *
 * @param count - The times to repeat.
 * @param value - The value to be repeated.
 * @returns The repeated list.
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
    (target: T) =>
        findIndex((value: T) => equalityT.eq(value, target));
/**
 * Finds the positions of element which satisfies `pred` in the list. If the list is infinite, this will hang forever.
 *
 * @param pred - The match condition of element to find.
 * @param list - The source list.
 * @returns The found positions.
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
/**
 * Finds the positions of element which equals to `target` in the list. If the list is infinite, this will hang forever.
 *
 * @param equalityT - The equality for `T`.
 * @param target - The element to find.
 * @returns The found positions.
 */
export const elemIndices =
    <T>(equalityT: PartialEq<T>) =>
    (target: T) =>
        findIndices((value: T) => equalityT.eq(value, target));

/**
 * Takes while the element satisfies `pred`. If the element matches `pred`, the list will fuse at the element.
 *
 * ```ts
 * const iota = successors((x: number) => x + 1)(0);
 * const lessThanSqrt10 = takeWhile((x: number) => x * x < 10)(iota);
 * ```
 *
 * @param pred - The condition to decide to stop the list.
 * @returns The filtered list.
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
 * ```ts
 * const list = fromArray([-1, 0, 1, -2]);
 * const filtered = dropWhile((x: number) => x < 0)(list);
 * expect(toArray(filtered)).toEqual([0, 1, -2]);
 * ```
 *
 * @param pred - The condition to decide to drop from the list.
 * @returns The filtered list.
 */
export const dropWhile =
    <T>(pred: (t: T) => boolean) =>
    (list: List<T>): List<T> =>
        either<List<T>>(empty)((x: T, xs) => (pred(x) ? dropWhile(pred)(xs) : list))(list);
/**
 * Drops the largest suffix of the list in which `pred` holds for all elements of the suffix.
 *
 * @param pred - The condition to drop the suffix.
 * @returns The list dropped the matched suffix.
 */
export const dropWhileEnd = <T>(pred: (t: T) => boolean): ((list: List<T>) => List<T>) =>
    foldR<T, List<T>>((x) => (xs) => pred(x) && isNull(xs) ? empty() : appendToHead(x)(xs))(
        empty(),
    );

/**
 * Splits the list into a tuple of the longest prefix satisfies `pred` and the rest. It is equivalent to `[takeWhile(pred)(list), dropWhile(pred)(list)]`.
 *
 * @param pred - The condition to split.
 * @returns The tuple of split of the list.
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
 */
export const spanNot = <T>(pred: (t: T) => boolean) => span((t: T) => !pred(t));

/**
 * Strips `list` if matches `prefix`, otherwise returns `none`.
 *
 * @param equalityT - The equality for `T`.
 * @param prefix - The prefix to strip.
 * @param list - The source list.
 * @returns The stripped list.
 */
export const stripPrefix =
    <T>(equalityT: PartialEq<T>) =>
    (prefix: List<T>) =>
    (list: List<T>): Option.Option<List<T>> =>
        either<Option.Option<List<T>>>(() => Option.some(list))((x: T, xs) =>
            Option.andThen(([y, ys]: [T, List<T>]) =>
                equalityT.eq(x, y) ? stripPrefix<T>(equalityT)(xs)(ys) : Option.none(),
            )(unCons(list)),
        )(prefix);

/**
 * Groups the list into sub-lists when adjacent elements are satisfy `pred`.
 *
 * @param pred - The condition to group.
 * @param list - The source list.
 * @returns The list of grouped sub-list.
 */
export const groupBy = <T>(pred: (l: T) => (r: T) => boolean): ((list: List<T>) => List<List<T>>) =>
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
 */
export const group = <T>(equalityT: PartialEq<T>): ((list: List<T>) => List<List<T>>) =>
    groupBy((l) => (r) => equalityT.eq(l, r));

/**
 * Filters the list by `pred`. The elements which satisfy `pred` are only passed.
 *
 * @param pred - The condition to pick up an element.
 * @returns The filtered list.
 */
export const filter = <T>(pred: (element: T) => boolean): ((list: List<T>) => List<T>) =>
    flatMap((element) => (pred(element) ? singleton(element) : empty()));

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
            return appendToHead(flatMap((t: List<T>) => fromOption(t.current()))(b))(
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
export const diagonal = <T>(listList: List<List<T>>): List<T> => concat(diagonals(listList));

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
                (b: B): Tuple<A, B> =>
                    [a, b],
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
 * ```ts
 * const choice = choices(fromArray([range(0, 3), range(3, 6)]));
 * const sequences = toArray(choice).map((seq) => toArray(seq));
 * expect(sequences).toEqual([
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
 *
 * @param listList - The finite list of (possibly infinite) list.
 * @returns The choose list.
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
    apply:
        <T1, U1>(fns: List<(t: T1) => U1>) =>
        (t: List<T1>): List<U1> =>
            concat(map((fn: (t: T1) => U1) => map(fn)(t))(fns)),
};

/**
 * The instance of `Traversable` for `List`.
 */
export const traversable: Traversable<ListHkt> = {
    map,
    foldR,
    traverse:
        <F extends Hkt1>(app: Applicative<F>) =>
        <A, B>(visitor: (a: A) => Get1<F, B>): ((list: List<A>) => Get1<F, List<B>>) => {
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
