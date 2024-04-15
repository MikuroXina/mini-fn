/**
 * This package provides an optional value `Option<T>`, which is either `Some` or `None`. `Some` contains a value, and `None` does not.
 *
 * There is a number of use cases about `Option`:
 *
 * - Nullable value
 * - Lazy initialized value
 * - Optional parameter
 * - Return value for showing that there are no meaningful value to report error
 * - Optional field of an object
 *
 * @packageDocumentation
 */
import { doT } from "./cat.ts";
import type { Get1, Hkt1 } from "./hkt.ts";
import type { Optic, OpticSimple } from "./optical.ts";
import { newPrism, newPrismSimple } from "./optical/prism.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { err, isOk, ok, type Result } from "./result.ts";
import {
    type Decoder,
    decU8,
    type Encoder,
    encU8,
    flatMapCodeM,
    mapDecoder,
    monadForDecoder,
    pureDecoder,
} from "./serial.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import { TraversableMonad } from "./type-class/traversable-monad.ts";
import type { Traversable } from "./type-class/traversable.ts";

const someSymbol = Symbol("OptionSome");
/**
 * The variant of `Option`, expresses that there are an item.
 */
export type Some<T> = readonly [typeof someSymbol, T];
/**
 * Creates a new `Some` from the value.
 *
 * @param v - The value to be contained.
 * @returns The new `Some`.
 */
export const some = <T>(v: T): Some<T> => [someSymbol, v];

const noneSymbol = Symbol("OptionNone");
/**
 * The variant of `Option`, expresses that there are no item.
 */
export type None = readonly [typeof noneSymbol];
/**
 * Creates a new `None`.
 *
 * @returns The new `None`.
 */
export const none = (): None => [noneSymbol];

/**
 * This is either `Some` or `None`. `Some` contains a value, and `None` does not.
 *
 * Considered that `None` is lesser than `Some` on the implementations of order.
 */
export type Option<T> = None | Some<T>;

/**
 * Creates a new `Option` from `t`, but only it will be `Some` when `predicate(t)` returns `true`.
 *
 * @param predicate - The function to decide the value should be contained.
 * @param t - The value to be contained when `predicate` shows `true`.
 * @returns The new optional.
 */
export const fromPredicate =
    <T>(predicate: (t: T) => boolean) => (t: T): Option<T> => {
        if (predicate(t)) {
            return some(t);
        }
        return none();
    };

/**
 * Checks whether `opt` is `Some`.
 *
 * @param opt - The optional value.
 * @returns The proof that `opt` is a `Some`.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, isSome } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(isSome(some(2)), true);
 * assertEquals(isSome(none()), false);
 * ```
 */
export const isSome = <T>(opt: Option<T>): opt is Some<T> =>
    opt[0] === someSymbol;

/**
 * Checks whether `opt` is `None`.
 *
 * @param opt - The optional value.
 * @returns The proof that `opt` is a `None`.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, isNone } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(isNone(some(2)), false);
 * assertEquals(isNone(none()), true);
 * ```
 */
export const isNone = <T>(opt: Option<T>): opt is None => opt[0] === noneSymbol;

/**
 * Converts into a string for debug. It is not safe for serialization.
 *
 * @param opt - The optional value.
 * @returns The string form.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, toString } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toString(some(2)), "some(2)");
 * assertEquals(toString(none()), "none");
 * ```
 */
export const toString = <T>(
    opt: Option<T>,
) => (isSome(opt) ? `some(${opt[1]})` : "none");

/**
 * Converts into an array.
 *
 * @param opt - The optional value.
 * @returns The array which contains zero or one element.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, toArray } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(toArray(some(2)), [2]);
 * assertEquals(toArray(none()), []);
 * ```
 */
export const toArray = <T>(opt: Option<T>): T[] => {
    const arr = [...opt] as unknown[];
    arr.shift();
    return arr as T[];
};

export const partialEquality =
    <T>(equalityT: PartialEq<T>) =>
    (optA: Option<T>, optB: Option<T>): boolean =>
        (isNone(optA) && isNone(optB)) ||
        (isSome(optA) && isSome(optB) && equalityT.eq(optA[1], optB[1]));
export const partialEq = fromPartialEquality(partialEquality);
export const equality =
    <T>(equalityT: Eq<T>) => (optA: Option<T>, optB: Option<T>): boolean =>
        (isNone(optA) && isNone(optB)) ||
        (isSome(optA) && isSome(optB) && equalityT.eq(optA[1], optB[1]));
export const eq = fromEquality(equality);
export const partialCmp =
    <T>(order: PartialOrd<T>) =>
    (l: Option<T>, r: Option<T>): Option<Ordering> => {
        // considered that None is lesser than Some
        if (isNone(l)) {
            if (isNone(r)) {
                return some(equal);
            }
            return some(less);
        }
        if (isNone(r)) {
            return some(greater);
        }
        return order.partialCmp(l[1], r[1]);
    };
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <T>(order: Ord<T>) => (l: Option<T>, r: Option<T>): Ordering => {
        // considered that None is lesser than Some
        if (isNone(l)) {
            if (isNone(r)) {
                return equal;
            }
            return less;
        }
        if (isNone(r)) {
            return greater;
        }
        return order.cmp(l[1], r[1]);
    };
// This argument wrapper is needed for avoid cyclic-import problem.
export const ord = <T>(order: Ord<T, T>) => fromCmp(cmp)(order);

/**
 * Flattens the nested optional.
 *
 * @param opt - The nested optional.
 * @returns The flattened optional.
 *
 * # Examples
 *
 * ```ts
 * import { flatten, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(flatten(some(some(6))), some(6));
 * assertEquals(flatten(some(none())), none());
 * assertEquals(flatten(none()), none());
 * ```
 */
export const flatten = <T>(opt: Option<Option<T>>): Option<T> => {
    if (isSome(opt)) {
        return opt[1];
    }
    return opt;
};

/**
 * Unwraps the optional value. Passing `none` will throw an error, so you must use this only when `opt` is considered to be only a `Some`.
 *
 * @param opt - The optional value which it considers to be a `Some`.
 * @returns The unwrapped value.
 */
export const unwrap = <T>(opt: Option<T>): T => {
    if (isNone(opt)) {
        throw new Error("unwrapped None");
    }
    return opt[1];
};

/**
 * Returns `None` if `optA` is `None`, otherwise returns `optB`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param optB - The second optional when used `optA` is `Some`.
 * @param optA - The first optional.
 * @returns `optB` or a `None`.
 *
 * # Examples
 *
 * ```ts
 * import { and, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(and(none())(none()), none());
 * assertEquals(and(none())(some(2)), none());
 * assertEquals(and(some("foo"))(none()), none());
 * assertEquals(and(some("foo"))(some(2)), some("foo"));
 * ```
 */
export const and = <U>(optB: Option<U>) => <T>(optA: Option<T>): Option<U> => {
    if (isSome(optA)) {
        return optB;
    }
    return optA;
};

/**
 * Returns `None` if `optA` is `None`, otherwise calls `optB` and return the result. This is an implementation of `FlatMap`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param optB - The function returns second optional when used `optA` is `Some`.
 * @param optA - The first optional.
 * @returns `optB` or a `None`.
 *
 * # Examples
 *
 * ```ts
 * import { andThen, Option, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const sqrtThenToString = (num: number): Option<string> =>
 *     0 <= num ? some(Math.sqrt(num).toString()) : none();
 *
 * const applied = andThen(sqrtThenToString);
 * assertEquals(applied(some(4)), some("2"));
 * assertEquals(applied(some(-1)), none());
 * assertEquals(applied(none()), none());
 * ```
 */
export const andThen =
    <T, U>(optB: (t: T) => Option<U>) => (optA: Option<T>): Option<U> => {
        if (isSome(optA)) {
            return optB(optA[1]);
        }
        return optA;
    };

/**
 * Returns the optional `optA` if it contains a value, otherwise returns `optB`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param optB - The fallback optional.
 * @param optA - The source optional.
 * @returns `optA` or `optB`.
 *
 * # Examples
 *
 * ```ts
 * import { or, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(or(none())(none()), none());
 * assertEquals(or(none())(some(2)), some(2));
 * assertEquals(or(some(100))(none()), some(100));
 * assertEquals(or(some(100))(some(2)), some(2));
 * ```
 */
export const or = <T>(optB: Option<T>) => (optA: Option<T>): Option<T> => {
    if (isSome(optA)) {
        return optA;
    }
    return optB;
};

/**
 * Returns the optional `optA` if it contains a value, otherwise calls `optB` and returns the result. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param optB - The function to create a fallback optional.
 * @param optA - The source optional.
 * @returns `optA` or `optB`.
 *
 * # Examples
 *
 * ```ts
 * import { orElse, Option, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const nobody = orElse((): Option<string> => none());
 * const vikings = orElse((): Option<string> => some("vikings"));
 *
 * assertEquals(vikings(some("barbarians")), some("barbarians"));
 * assertEquals(vikings(none()), some("vikings"));
 * assertEquals(nobody(none()), none());
 * ```
 */
export const orElse =
    <T>(optB: () => Option<T>) => (optA: Option<T>): Option<T> => {
        if (isSome(optA)) {
            return optA;
        }
        return optB();
    };

/**
 * Returns `Some` if exactly one of `optA` and `optB` is `Some`, otherwise returns `None`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param optB - The second optional.
 * @param optA - The first optional.
 * @returns `optA` exclusive or `optB`.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, xor } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(xor(none())(none()), none());
 * assertEquals(xor(none())(some(2)), some(2));
 * assertEquals(xor(some(100))(none()), some(100));
 * assertEquals(xor(some(100))(some(2)), none());
 * ```
 */
export const xor = <T>(optB: Option<T>) => (optA: Option<T>) => {
    if (isSome(optA) && isNone(optB)) {
        return optA;
    }
    if (isNone(optA) && isSome(optB)) {
        return optB;
    }
    return none();
};

/**
 * Returns `Some` only if `opt` is a `Some` and its value satisfies `predicate`, otherwise returns `None`.
 *
 * @param predicate - The predicate to filter a value of `opt`.
 * @returns The filtered optional.
 *
 * # Examples
 *
 * ```ts
 * import { filter, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const isEven = filter((x: number) => x % 2 == 0);
 *
 * assertEquals(isEven(none()), none());
 * assertEquals(isEven(some(3)), none());
 * assertEquals(isEven(some(4)), some(4));
 * ```
 */
export const filter = <T>(predicate: (t: T) => boolean) => (opt: Option<T>) => {
    if (isSome(opt)) {
        if (predicate(opt[1])) {
            return opt;
        }
    }
    return none();
};

/**
 * Zips two optionals into one.
 *
 * @param optA - The left-side optional.
 * @param optB - The right-side optional.
 * @returns The zipped optional of tuple.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, zip } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(zip(some(1))(some("hi")), some([1, "hi"] as [number, string]));
 * assertEquals(zip(some(1))(none()), none());
 * assertEquals(zip(none())(some(1)), none());
 * assertEquals(zip(none())(none()), none());
 * ```
 */
export const zip =
    <T>(optA: Option<T>) => <U>(optB: Option<U>): Option<[T, U]> => {
        if (isSome(optA) && isSome(optB)) {
            return some([optA[1], optB[1]]);
        }
        return none();
    };

/**
 * Unzips the optional of tuple into the tuple of optionals.
 *
 * @param opt - The zipped optional of tuple.
 * @returns The unzipped tuple of optionals.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, unzip } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(unzip(some([1, "hi"])), [
 *     some(1),
 *     some("hi"),
 * ]);
 * assertEquals(unzip(none()), [
 *     none(),
 *     none(),
 * ]);
 * ```
 */
export const unzip = <T, U>(opt: Option<[T, U]>): [Option<T>, Option<U>] => {
    if (isSome(opt)) {
        return [some(opt[1][0]), some(opt[1][1])];
    }
    return [none(), none()];
};

/**
 * Zips two optionals into one with `fn`.
 *
 * @param fn - The zipping operation about `T` and `U`.
 * @param optA - The left-side optional.
 * @param optB - The right-side optional.
 * @returns The zipped optional of tuple.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, zipWith } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * interface Point {
 *     x: number;
 *     y: number;
 * }
 *
 * const newPoint = zipWith((x: number, y: number): Point => ({
 *     x,
 *     y,
 * }));
 *
 * assertEquals(newPoint(some(17.5))(some(42.7)), some({ x: 17.5, y: 42.7 }));
 * assertEquals(newPoint(none())(none()), none());
 * ```
 */
export const zipWith =
    <T, U, R>(fn: (t: T, u: U) => R) =>
    (optA: Option<T>) =>
    (optB: Option<U>): Option<R> => {
        if (isSome(optA) && isSome(optB)) {
            return some(fn(optA[1], optB[1]));
        }
        return none();
    };

/**
 * Extracts the contained `Some` value or `init`.
 *
 * @param init - The default value.
 * @param opt - The source optional.
 * @returns The contained value or `init`.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, unwrapOr } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const unwrapOrBike = unwrapOr("bike");

 * assertEquals(unwrapOrBike(some("car")), "car");
 * assertEquals(unwrapOrBike(none()), "bike");
 * ```
 */
export const unwrapOr = <T>(init: T) => (opt: Option<T>) => {
    if (isSome(opt)) {
        return opt[1];
    }
    return init;
};
/**
 * Extracts the contained `Some` value or `fn()`.
 *
 * @param fn - The function to provide a default value.
 * @param opt - The source optional.
 * @returns The contained value or `fn()`.
 *
 * # Examples
 *
 * ```ts
 * import { some, none, unwrapOrElse } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const unwrapOrCalc = unwrapOrElse(() => 6 ** 4);

 * assertEquals(unwrapOrCalc(some(4)), 4);
 * assertEquals(unwrapOrCalc(none()), 1296);
 * ```
 */
export const unwrapOrElse = <T>(fn: () => T) => (opt: Option<T>) => {
    if (isSome(opt)) {
        return opt[1];
    }
    return fn();
};

/**
 * Maps the function onto `Option`.
 *
 * @param f - The function from `T` to `U`.
 * @returns The function from `Option<T>` to `Option<U>`.
 *
 * # Examples
 *
 * ```ts
 * import { some, map, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const strLen = map((str: string) => str.length);

 * assertEquals(strLen(some("Hello, World!")), some(13));
 * assertEquals(strLen(none()), none());
 * ```
 */
export const map = <T, U>(f: (t: T) => U) => (opt: Option<T>): Option<U> => {
    if (opt[0] === someSymbol) {
        return some(f(opt[1]));
    }
    return opt;
};

/**
 * Maps the optional value with a default value `init`.
 *
 * @param init - The default value.
 * @param f - The function to map.
 * @param opt - The optional to be mapped.
 * @returns The mapped value or `init`.
 *
 * # Examples
 *
 * ```ts
 * import { some, mapOr, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const strLenOrAnswer = mapOr(42)((str: string) => str.length);

 * assertEquals(strLenOrAnswer(some("Hello, World!")), 13);
 * assertEquals(strLenOrAnswer(none()), 42);
 * ```
 */
export const mapOr =
    <U>(init: U) => <T>(f: (t: T) => U) => (opt: Option<T>): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return init;
    };

/**
 * Maps the optional value with a default value `fn()`.
 *
 * @param fn - The function to provide a default value.
 * @param f - The function to map.
 * @param opt - The optional to be mapped.
 * @returns The mapped value or `init`.
 *
 * # Examples
 *
 * ```ts
 * import { some, mapOrElse, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const strLenOrCalc = mapOrElse(() => 6 ** 4)((str: string) => str.length);

 * assertEquals(strLenOrCalc(some("Hello, World!")), 13);
 * assertEquals(strLenOrCalc(none()), 1296);
 * ```
 */
export const mapOrElse =
    <U>(fn: () => U) => <T>(f: (t: T) => U) => (opt: Option<T>): U => {
        if (opt[0] === someSymbol) {
            return f(opt[1]);
        }
        return fn();
    };

/**
 * Checks whether the optional `opt` contains `x` value.
 *
 * @param x - The value to check.
 * @param opt - The optional to be checked.
 * @returns Whether `x` is contained.
 *
 * # Examples
 *
 * ```ts
 * import { contains, some, none } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const hasTwo = contains(2);

 * assertEquals(hasTwo(some(2)), true);
 * assertEquals(hasTwo(some(3)), false);
 * assertEquals(hasTwo(none()), false);
 * ```
 */
export const contains = <T>(x: T) => (opt: Option<T>) =>
    mapOr(false)((t) => t === x)(opt);

/**
 * Transforms `Option<Result<E, T>>` into `Result<E, Option<T>>` as:
 *
 * - `none()` will be mapped to `ok(none())`
 * - `some(ok(x))` will be mapped to `ok(some(x))`
 * - `some(err(e))` will be mapped to `err(e)`.
 *
 * @param optRes - `Option` containing `Result`.
 * @returns `Result` containing `Option`.
 *
 * # Examples
 *
 * ```ts
 * import { optResToResOpt, some, none } from "./option.ts";
 * import { err, ok } from "./result.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * assertEquals(optResToResOpt(some(ok(5))), ok(some(5)));
 * assertEquals(optResToResOpt(none()), ok(none()));
 * assertEquals(optResToResOpt(some(err(5))), err(5));
 * ```
 */
export const optResToResOpt = <E, T>(
    optRes: Option<Result<E, T>>,
): Result<E, Option<T>> => {
    if (isNone(optRes)) {
        return ok(none());
    }
    if (isOk(optRes[1])) {
        return ok(some(optRes[1][1]));
    }
    return err(optRes[1][1]);
};

/**
 * Transforms the optional value into `Result` with the error `e`.
 *
 * @param e - The error used when `opt` is a `None`.
 * @param opt - The optional to be transformed.
 * @returns The new `Result`.
 *
 * # Examples
 *
 * ```ts
 * import { okOr, some, none } from "./option.ts";
 * import { err, ok } from "./result.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const orZero = okOr(0);

 * assertEquals(orZero(some("foo")), ok("foo"));
 * assertEquals(orZero(none()), err(0));
 * ```
 */
export const okOr = <E>(e: E) => <T>(opt: Option<T>): Result<E, T> =>
    mapOrElse<Result<E, T>>(() => err<E>(e))((t: T) => ok(t))(opt);

/**
 * Transforms the optional value into `Result` with the error `e()`.
 *
 * @param e - The function provides an error used when `opt` is a `None`.
 * @param opt - The optional to be transformed.
 * @returns The new `Result`.
 *
 * # Examples
 *
 * ```ts
 * import { okOrElse, some, none } from "./option.ts";
 * import { err, ok } from "./result.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const orZero = okOrElse(() => 0);

 * assertEquals(orZero(some("foo")), ok("foo"));
 * assertEquals(orZero(none()), err(0));
 * ```
 */
export const okOrElse = <E>(e: () => E) => <T>(opt: Option<T>): Result<E, T> =>
    mapOrElse<Result<E, T>>(() => err<E>(e()))((t: T) => ok(t))(opt);

/**
 * The alias of `andThen`.
 */
export const flatMap = andThen;

export const apply =
    <T1, U1>(fnOpt: Option<(t: T1) => U1>) => (tOpt: Option<T1>) =>
        flatMap((fn: (t: T1) => U1) => map(fn)(tOpt))(fnOpt);

export const foldR =
    <A, B>(folder: (next: A) => (acc: B) => B) =>
    (init: B) =>
    (data: Option<A>) => {
        if (isNone(data)) {
            return init;
        }
        return folder(data[1])(init);
    };

export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (opt: Option<A>): Get1<F, Option<B>> => {
        if (isNone(opt)) {
            return app.pure(none() as Option<B>);
        }
        return app.map<B, Option<B>>(some)(visitor(opt[1]));
    };

export interface OptionHkt extends Hkt1 {
    readonly type: Option<this["arg1"]>;
}

/**
 * The instance of `Monoid` for `Option`.
 */
export const monoid = <T>(): Monoid<Option<T>> => ({
    combine: (l, r) => or(l)(r),
    identity: none(),
    [semiGroupSymbol]: true,
});

/**
 * The instance of `Functor` for `Option`.
 */
export const functor: Functor<OptionHkt> = {
    map,
};

/**
 * The instance of `Monad` for `Option`.
 */
export const monad: Monad<OptionHkt> = {
    pure: some,
    map,
    flatMap,
    apply,
};

/**
 * The instance of `Traversable` for `Option`.
 */
export const traversable: Traversable<OptionHkt> = {
    map,
    foldR,
    traverse,
};

/**
 * The instance of `TraversableMonad` for `Option<_>`.
 */
export const traversableMonad: TraversableMonad<OptionHkt> = {
    pure: some,
    map,
    flatMap: andThen,
    apply,
    foldR,
    traverse,
};

export const ifSome = <T, U>(): Optic<Option<T>, Option<U>, T, U> =>
    newPrism<U, Option<U>>(some)(
        mapOrElse<Result<Option<U>, T>>(() => err(none()))(ok),
    );
export const ifNone = <T>(): OpticSimple<Option<T>, void> =>
    newPrismSimple<void, Option<T>>(none)(
        mapOrElse<Option<void>>(() => some(undefined))(none),
    );

export const enc = <T>(encT: Encoder<T>): Encoder<Option<T>> => (value) =>
    isNone(value) ? encU8(0) : flatMapCodeM(() => encT(value[1]))(encU8(1));
export const dec = <T>(decT: Decoder<T>): Decoder<Option<T>> =>
    doT(monadForDecoder)
        .addM("tag", decU8)
        .finishM(({ tag }): Decoder<Option<T>> =>
            tag === 0 ? pureDecoder(none()) : mapDecoder(some)(decT)
        );
