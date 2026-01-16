/**
 * `Result<E, T>` shows an error handling with the variants, `Err<E>`, representing error and containing an error value, and `Ok<T>`, representing success and containing a passing value.
 *
 * # Functions overview
 *
 * Almost of all, you don't need to access the internal value with `[0]` or `[1]` to check whether a `Result<E, T>` is `Err<E>` or `Ok<T>`. Instead you can use the functions provided by this module.
 *
 * ## Constructors
 *
 * `ok` and `err` functions construct the `Result` from value to contain. They have individual type `Ok<T>` and `Err<E>`, respectively. So sometimes you need to upcast into `Result<E, T>`.
 *
 * ## Querying the variant
 *
 * `isOk` and `isErr` functions return `true` if the `Result` is `Ok` or `Err`, respectively. These provides the type assertion on TypeScript.
 *
 * ## Extracting contained values
 *
 * These functions extract the contained value in a `Result<E, T>` when it is the `Ok` variant. If it is `Err`:
 *
 * - `unwrap` throws an `Error` with a generic message
 * - `unwrapOr` returns the provided the default value
 * - `unwrapOrElse` returns the result of evaluating the provided function
 *
 * And this function extracts the contained error value `E` in a `Result<E, T>`. If it is `Ok`:
 *
 * - `unwrapErr` throws an `Error` with a generic message
 *
 * ## Transforming contained values
 *
 * These functions transform `Result` to `Option`:
 *
 * - `optionOk` transforms `Result<E, T>` into `Option<T>`, mapping `Ok<T>` to `Some<T>` and `Err<E>` to `None`
 * - `optionErr` transforms `Result<E, T>` into `Option<E>`, mapping `Err<E>` to `Some<E>` and `Ok<T>` to `None`
 * - `resOptToOptRes` transposes a `Result` of an `Option` into an `Option` of a `Result`
 *
 * This function transforms the contained value of the `Ok` variant:
 *
 * - `map` transforms `Result<E, T>` into `Result<E, U>` by applying the provided function `(t: T) => U` to the contained value of `Ok` and leaving `Err` values unchanged
 * - `product` transforms `Result<E, T>` and `Result<E, U>` into a new `Result<E, [T, U]>` and leaving `Err` values occurred at first
 *
 * This function transforms the contained value of the `Err` variant:
 *
 * - `mapErr` transforms `Result<E, T>` into `Result<F, T>` by applying the provided function to the contained value of `Err` and leaving `Ok` values unchanged
 *
 * These functions transform a `Result<E, T>` into a value of possibly different type `U`:
 *
 * - `mapOr` applies the provided function to the contained value of `Ok`, or returns the provided default value if the `Result` is `Err`
 * - `mapOrElse` applies the provided function to the contained value of `Ok`, or applies the provided default fallback function to the contained value of `Err`
 *
 * This functions transform both of the contained value at same time.
 *
 * - `biMap` applies the two provided functions to the each contained value
 * - `mergeOkErr` merges the contained values of `Result<T, T>` into `T`
 *
 * ## Boolean operators
 *
 * These functions treat the `Result` as a boolean value, where `Ok` acts like `true` and `Err` acts like `false`. There are two categories of these methods: ones that take a `Result` as input, and ones that take a function as input (to be lazily evaluated).
 *
 * The `and` and `or` methods take another `Result` as input, and produce a `Result` as output. The `and` method can produce a `Result<E, U>` value having a different inner type `U` than `Result<E, T>`. The `or` method can produce a `Result<F, T>` value having a different error type `F` than `Result<E, T>`. Note that the order of parameters are reversed because of convenience of partial applying.
 *
 * | function | first parameter | second parameter (as self) | output   |
 * | :------- | :-------------- | :------------------------- | :------- |
 * | `and`    | *ignored*       | `err(e)`                   | `err(e)` |
 * | `and`    | `err(d)`        | `ok(x)`                    | `err(d)` |
 * | `and`    | `ok(y)`         | `ok(x)`                    | `ok(y)`  |
 * | `or`     | `err(d)`        | `err(e)`                   | `err(d)` |
 * | `or`     | `ok(y)`         | `err(e)`                   | `ok(y)`  |
 * | `or`     | *ignored*       | `ok(x)`                    | `ok(x)`  |
 *
 *  The `andThen` and `orElse` functions take a function as input, and only evaluate the function when they need to produce a new value. The `andThen` function can produce a `Result<E, T>` value having a different inner type `U` than `Result<E, T>`. The `orElse` function can produce a `Result<F, T>` value having a different error type `F` than `Result<E, T>`.
 *
 * | function  | first parameter | second parameter (as self) | output   |
 * | :-------- | :-------------- | :------------------------- | :------- |
 * | `andThen` | *ignored*       | `err(e)`                   | `err(e)` |
 * | `andThen` | `f`             | `ok(x)`                    | `f(x)`   |
 * | `orElse`  | *ignored*       | `ok(x)`                    | `ok(x)`  |
 * | `orElse`  | `f`             | `err(e)`                   | `f(e)`   |
 *
 * @packageDocumentation
 * @module
 */

import type { Apply2Only, Get1, Hkt2 } from "./hkt.js";
import { newPrism } from "./optical/prism.js";
import type { Optic } from "./optical.js";
import {
    isSome,
    none,
    type Option,
    toArray as optionToArray,
    some,
} from "./option.js";
import { greater, less, type Ordering } from "./ordering.js";
import {
    type Decoder,
    decSum,
    decU8,
    type Encoder,
    encSum,
    encU8,
    mapDecoder,
} from "./serial.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Bifoldable } from "./type-class/bifoldable.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import type { Bitraversable } from "./type-class/bitraversable.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { ErrorMonad } from "./type-class/error-monad.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import {
    fromPartialEquality,
    type PartialEq,
    type PartialEqUnary,
} from "./type-class/partial-eq.js";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.js";
import type { Pure } from "./type-class/pure.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import type { SemiGroupal } from "./type-class/semi-groupal.js";
import type { Traversable } from "./type-class/traversable.js";
import type { TraversableMonad } from "./type-class/traversable-monad.js";

const okSymbol = Symbol("ResultOk");
const errSymbol = Symbol("ResultErr");

/**
 * The `Ok` variant of `Result`, which expresses a success.
 */
export type Ok<T> = readonly [typeof okSymbol, T];
/**
 * The `Err` variant of `Result`, which expresses an error.
 */
export type Err<E> = readonly [typeof errSymbol, E];

/**
 * The type represents either error `Err` or success `Ok`. Note that the order of type arguments is `E, T`, because it is useful to place the primary type parameter on the last.
 */
export type Result<E, T> = Err<E> | Ok<T>;

/**
 * Creates a new success value.
 *
 * @param v - The success value.
 * @returns The new `Ok` .
 */
export const ok = <T>(v: T): Ok<T> => [okSymbol, v];
/**
 * Creates a new error value.
 *
 * @param e - The error value.
 * @returns The new `Err`.
 */
export const err = <E>(e: E): Err<E> => [errSymbol, e];

/**
 * Checks whether the result is an `Ok`.
 *
 * @param res - The result to be checked.
 * @returns Whether the result is an `Ok`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(isOk(ok(-3))).toStrictEqual(true);
 * expect(isOk(err("Some error message"))).toStrictEqual(false);
 * ```
 */
export const isOk = <E, T>(res: Result<E, T>): res is Ok<T> =>
    res[0] === okSymbol;

/**
 * Checks whether the result is an `Err`.
 *
 * @param res - The result to be checked.
 * @returns Whether the result is an `Err`.
 */
export const isErr = <E, T>(res: Result<E, T>): res is Err<E> =>
    res[0] === errSymbol;

export const partialEquality =
    <E, L, R = L>({
        equalityE,
        equalityT,
    }: {
        equalityE: PartialEq<E>;
        equalityT: PartialEq<L, R>;
    }) =>
    (l: Result<E, L>, r: Result<E, R>): boolean => {
        if (isErr(l) && isErr(r)) {
            return equalityE.eq(l[1], r[1]);
        }
        if (isOk(l) && isOk(r)) {
            return equalityT.eq(l[1], r[1]);
        }
        return false;
    };
export const partialEq: <E, L, R = L>({
    equalityE,
    equalityT,
}: {
    equalityE: PartialEq<E>;
    equalityT: PartialEq<L, R>;
}) => PartialEq<Result<E, L>, Result<E, R>> =
    fromPartialEquality(partialEquality);
export const equality = <E, L, R = L>(equalities: {
    equalityE: Eq<E>;
    equalityT: Eq<L, R>;
}): ((l: Result<E, L>, r: Result<E, R>) => boolean) =>
    partialEquality(equalities);
export const eq: <E, L, R = L>(equalities: {
    equalityE: Eq<E>;
    equalityT: Eq<L, R>;
}) => Eq<Result<E, L>, Result<E, R>> = fromEquality(equality);
export const partialCmp =
    <E, T>({
        orderE,
        orderT,
    }: {
        orderE: PartialOrd<E>;
        orderT: PartialOrd<T>;
    }) =>
    (l: Result<E, T>, r: Result<E, T>): Option<Ordering> => {
        // considered that Ok is lesser than Err
        if (isOk(l)) {
            if (isOk(r)) {
                return orderT.partialCmp(l[1], r[1]);
            }
            return some(less);
        }
        if (isOk(r)) {
            return some(greater);
        }
        return orderE.partialCmp(l[1], r[1]);
    };
export const partialOrd: <E, T>({
    orderE,
    orderT,
}: {
    orderE: PartialOrd<E>;
    orderT: PartialOrd<T>;
}) => PartialOrd<Result<E, T>> = fromPartialCmp(partialCmp);
export const cmp =
    <E, T>({ orderE, orderT }: { orderE: Ord<E>; orderT: Ord<T> }) =>
    (l: Result<E, T>, r: Result<E, T>): Ordering => {
        // considered that Ok is lesser than Err
        if (isOk(l)) {
            if (isOk(r)) {
                return orderT.cmp(l[1], r[1]);
            }
            return less;
        }
        if (isOk(r)) {
            return greater;
        }
        return orderE.cmp(l[1], r[1]);
    };
// This argument wrapper is needed for avoid cyclic-import problem.
export const ord = <E, T>(x: {
    orderE: Ord<E, E>;
    orderT: Ord<T, T>;
}): Ord<Result<E, T>> => fromCmp(cmp)(x);

/**
 * The `PartialEqUnary` instance for `Result<E, _>`.
 */
export const partialEqUnary = <E>(
    equalityE: PartialEq<E>,
): PartialEqUnary<Apply2Only<ResultHkt, E>> => ({
    liftEq: (equality) =>
        partialEquality({ equalityE: equalityE, equalityT: { eq: equality } }),
});

/**
 * Wraps the return value of `body` into a {@link Result.Result | `Result`}.
 *
 * @param catcher - The function to cast an error from `body`.
 * @param body - The function to be wrapped.
 * @returns The wrapped function.
 */
export const wrapThrowable =
    <E>(catcher: (err: unknown) => E) =>
    <A extends unknown[], R>(body: (...args: A) => R) =>
    (...args: A): Result<E, R> => {
        try {
            return ok(body(...args));
        } catch (error: unknown) {
            return err(catcher(error));
        }
    };

/**
 * Wraps the return value of `body` into a {@link Result.Result | `Result`} over `Promise`.
 *
 * @param catcher - The function to cast an error from `body`.
 * @param body - The asynchronous function to be wrapped.
 * @returns The wrapped function.
 */
export const wrapAsyncThrowable =
    <E>(catcher: (err: unknown) => E) =>
    <A extends unknown[], R>(body: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<Result<E, R>> => {
        try {
            return ok(await body(...args));
        } catch (error: unknown) {
            return err(catcher(error));
        }
    };

/**
 * Maps the value in variant by two mappers.
 *
 * @param g - The mapper from error.
 * @param f - The mapper from success.
 * @param res - The result to be mapped.
 * @returns The mapped value.
 */
export const either =
    <E, R>(g: (e: E) => R) =>
    <T>(f: (t: T) => R) =>
    (res: Result<E, T>): R =>
        isOk(res) ? f(res[1]) : g(res[1]);

/**
 * Flattens the nested result, The error held by an outer one will be preceded.
 *
 * @param resRes - The nested result.
 * @returns The unwrapped nest.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(flatten(ok(ok("hello")))).toStrictEqual(ok("hello"));
 * expect(flatten(err(ok("hello")))).toStrictEqual(err(ok("hello")));
 * expect(flatten(ok(err(6)))).toStrictEqual(err(6));
 * expect(flatten(err(err(6)))).toStrictEqual(err(err(6)));
 * ```
 */
export const flatten = <E, T>(resRes: Result<E, Result<E, T>>): Result<E, T> =>
    isOk(resRes) ? resRes[1] : err(resRes[1]);

/**
 * Unwraps the value for the result whose type parameters of are same.
 *
 * @param res - The source result.
 * @returns The contained value.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(mergeOkErr(ok(3))).toStrictEqual(3);
 * expect(mergeOkErr(err(4))).toStrictEqual(4);
 * ```
 */
export const mergeOkErr = <T>(res: Result<T, T>) => res[1];

/**
 * Unwraps the `Ok` value from a `Result`, or throws an error.
 *
 * @param res - The value which should be an `Ok`.
 * @returns The unwrapped item.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(unwrap(ok(3))).toStrictEqual(3);
 * expect(() => unwrap(err(4))).toThrowError("unwrapped Err");
 * ```
 */
export const unwrap = <E, T>(res: Result<E, T>): T => {
    if (isErr(res)) {
        throw new Error("unwrapped Err");
    }
    return res[1];
};

/**
 * Unwraps the `Err` value from a `Result`, or throws an error.
 *
 * @param res - The value which should be an `Err`.
 * @returns The unwrapped item.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(() => unwrapErr(ok(3))).toThrowError("unwrapped Ok");
 * expect(unwrapErr(err(4))).toStrictEqual(4);
 * ```
 */
export const unwrapErr = <E, T>(res: Result<E, T>): E => {
    if (isOk(res)) {
        throw new Error("unwrapped Ok");
    }
    return res[1];
};

/**
 * Returns `resB` if `resA` is an `Ok`, otherwise returns the error `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param resB - The second result.
 * @param resA - The first result.
 * @returns `resB` if `resA` is a `Ok`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const success = ok<number>(2);
 * const failure = err("not a 2");
 * const lateError = err("late error");
 * const earlyError = err("early error");
 * const anotherSuccess = ok("different result");

 * expect(and(lateError)(success)).toStrictEqual(lateError);
 * expect(and<number, string>(success)(earlyError)).toStrictEqual(earlyError);
 * expect(and(lateError)(failure)).toStrictEqual(failure);
 * expect(and(anotherSuccess)(success)).toStrictEqual(anotherSuccess);
 * ```
 */
export const and =
    <U, E>(resB: Result<E, U>) =>
    <T>(resA: Result<E, T>): Result<E, U> =>
        isOk(resA) ? resB : resA;

/**
 * Returns `fn(v)` if `resA` is an `Ok(v)`, otherwise returns the error `resA`. This is an implementation of `FlatMap`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param fn - The function provides a second result.
 * @param resA - The first result.
 * @returns `fn()` if `resA` is an `Ok`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const sqrtThenToString = andThen(
 *     (num: number): Result<string, string> =>
 *         num < 0
 *             ? err("num must not be negative")
 *             : ok(Math.sqrt(num).toString()),
 * );

 * expect(sqrtThenToString(ok(4))).toStrictEqual(ok("2"));
 * expect(sqrtThenToString(ok(-1))).toStrictEqual(err("num must not be negative"));
 * expect(sqrtThenToString(err("not a number"))).toStrictEqual(err("not a number"));
 * ```
 */
export const andThen =
    <T, U, E>(fn: (t: T) => Result<E, U>) =>
    (resA: Result<E, T>): Result<E, U> =>
        isOk(resA) ? fn(resA[1]) : resA;

/**
 * Returns `fn(v)` if `res` is an `Ok(v)`, otherwise the error `res`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param fn - The function which provides a second result.
 * @returns
 */
export const asyncAndThen =
    <T, U, F>(fn: (value: T) => Promise<Result<F, U>>) =>
    <E extends F>(res: Result<E, T>): Promise<Result<E | F, U>> =>
        isOk(res) ? fn(res[1]) : Promise.resolve(res);

/**
 * Returns `resB` if `resA` is an `Err`, otherwise returns the success `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param resB - The second result.
 * @param resA - The first result.
 * @returns `resA` or `resB`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const success = ok<number>(2);
 * const failure = err<string>("not a 2");
 * const lateError = err<string>("late error");
 * const earlyError = err<string>("early error");
 * const anotherSuccess = ok<number>(100);

 * expect(or<string, number>(lateError)(success)).toStrictEqual(success);
 * expect(or<string, number>(success)(earlyError)).toStrictEqual(success);
 * expect(or(lateError)(failure)).toStrictEqual(lateError);
 * expect(or(anotherSuccess)(success)).toStrictEqual(success);
 * ```
 */
export const or =
    <E, T>(resB: Result<E, T>) =>
    <F>(resA: Result<F, T>): Result<E, T> =>
        isErr(resA) ? resB : resA;

/**
 * Returns `fn()` if `resA` is an `Err`, otherwise returns the success `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param fn - The second result.
 * @param resA - The first result.
 * @returns `resA` or `fn()`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const sq = orElse((x: number) => ok<number>(x * x));
 * const residual = orElse((x: number) => err<number>(x));

 * expect(sq(sq(ok(2)))).toStrictEqual(ok(2));
 * expect(sq(residual(ok(2)))).toStrictEqual(ok(2));
 * expect(residual(sq(err(3)))).toStrictEqual(ok(9));
 * expect(residual(residual(err(3)))).toStrictEqual(err(3));
 * ```
 */
export const orElse =
    <F, T, E>(fn: (error: F) => Result<E, T>) =>
    (resA: Result<F, T>): Result<E, T> =>
        isErr(resA) ? fn(resA[1]) : resA;

/**
 * Takes the success value as an optional if the result is an `Ok`, otherwise returns `None`.
 *
 * @param res - The source result.
 * @returns The success value if exists.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(optionOk(ok(2))).toStrictEqual(some(2));
 * expect(optionOk(err("nothing left"))).toStrictEqual(none());
 * ```
 */
export const optionOk = <E, T>(res: Result<E, T>): Option<T> =>
    isOk(res) ? some(res[1]) : none();

/**
 * Takes the error value as an optional if the result is an `Err`, otherwise returns `None`.
 *
 * @param res - The source result.
 * @returns The error value if exists.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(optionErr(ok(2))).toStrictEqual(none());
 * expect(optionErr(err("nothing left"))).toStrictEqual(some("nothing left"));
 * ```
 */
export const optionErr = <E, T>(res: Result<E, T>): Option<E> =>
    isErr(res) ? some(res[1]) : none();

/**
 * Converts into a string for debug. It is not safe for serialization.
 *
 * @param opt - The result value.
 * @returns The string form.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(toString(ok(24))).toStrictEqual("ok(24)");
 * expect(toString(err("hoge"))).toStrictEqual("err(hoge)");
 * ```
 */
export const toString = <E, T>(res: Result<E, T>): string =>
    isOk(res) ? `ok(${res[1]})` : `err(${res[1]})`;

/**
 * Converts into an array.
 *
 * @param opt - The result value.
 * @returns The array which contains zero or one success element.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(toArray(ok(24))).toStrictEqual([24]);
 * expect(toArray(err("hoge"))).toStrictEqual([]);
 * ```
 */
export const toArray = <E, T>(res: Result<E, T>): T[] =>
    optionToArray(optionOk(res));

/**
 * Maps the function onto `Result<E, _>`.
 *
 * @param fn - The function from `T` to `U`.
 * @returns The mapped function.
 */
export const map =
    <T, U>(fn: (t: T) => U) =>
    <E>(res: Result<E, T>): Result<E, U> =>
        isOk(res) ? ok(fn(res[1])) : res;
/**
 * Applies `fn` to the contained success value, or returns the default value `init` if it is an `Err`.
 *
 * @param init - The default value.
 * @param fn - The function maps from `T`.
 * @param res - The source result.
 * @returns The mapped value.
 */
export const mapOr =
    <U>(init: U) =>
    <T>(fn: (t: T) => U) =>
    <E>(res: Result<E, T>): U =>
        isOk(res) ? fn(res[1]) : init;
/**
 * Applies `fn` to the contained success value, or returns the fallback value by `fallback` if it is an `Err`.
 *
 * @param fallback - The function to provide a fallback value.
 * @param fn - The function maps from `T`.
 * @param res - The source result.
 * @returns The mapped value.
 */
export const mapOrElse =
    <E, U>(fallback: (err: E) => U) =>
    <T>(fn: (t: T) => U) =>
    (res: Result<E, T>): U =>
        isOk(res) ? fn(res[1]) : fallback(res[1]);

/**
 * Maps the function onto `Result<_, T>`.
 *
 * @param fn - The function from `E` to `F`.
 * @returns The mapped function.
 */
export const mapErr =
    <E, F>(fn: (t: E) => F) =>
    <T>(res: Result<E, T>): Result<F, T> =>
        isErr(res) ? err(fn(res[1])) : res;

/**
 * Maps a {@link Result.Result | `Result`} with `mapper` over `Promise`.
 *
 * @param mapper - The asynchronous function from `T` to `U`.
 * @returns The mapped one on `Promise`.
 */
export const asyncMap =
    <T, U>(mapper: (value: T) => Promise<U>) =>
    async <E>(res: Result<E, T>): Promise<Result<E, U>> =>
        isOk(res) ? ok(await mapper(res[1])) : res;

/**
 * Makes a result of product from the two results.
 *
 * @param aRes - The left-side result.
 * @param bRes - The right-side result.
 * @returns The result of tuple.
 */
export const product =
    <E, A>(aRes: Result<E, A>) =>
    <B>(bRes: Result<E, B>): Result<E, [A, B]> =>
        andThen((a: A) => map((b: B): [A, B] => [a, b])(bRes))(aRes);

/**
 * Unwraps the success value, or returns the default value `init` if it is an `Err`.
 *
 * @param init - The default value.
 * @param res - The source result.
 * @returns The unwrapped value.
 */
export const unwrapOr =
    <T>(init: T) =>
    <E>(res: Result<E, T>): T =>
        isOk(res) ? res[1] : init;
/**
 * Unwraps the success value, or returns the fallback value `fallback` if it is an `Err`.
 *
 * @param fallback - The function to provide a fallback value.
 * @param res - The source result.
 * @returns The unwrapped value.
 */
export const unwrapOrElse =
    <E, T>(fallback: (err: E) => T) =>
    (res: Result<E, T>): T =>
        isOk(res) ? res[1] : fallback(res[1]);

/**
 * Maps two types on same time by two mappers.
 *
 * @param mapE - The function maps `Ok` value.
 * @param mapT - The function maps `Err` value.
 * @returns The mapped value.
 */
export const biMap =
    <E, D>(mapE: (err: E) => D) =>
    <T, U>(mapT: (ok: T) => U) =>
    (res: Result<E, T>): Result<D, U> =>
        isOk(res) ? ok(mapT(res[1])) : err(mapE(res[1]));

/**
 * Transforms `Result<E, Option<T>>` into `Option<Result<E, T>>` as:
 *
 * - `ok(some(x))` will be mapped to `some(ok(x))`
 * - `ok(none())` will be mapped to `none()`
 * - `err(e)` will be mapped to `some(err(e))`.
 *
 * @param optRes - `Option` containing `Result`.
 * @returns `Result` containing `Option`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * expect(resOptToOptRes(ok(some(5)))).toStrictEqual(some(ok(5)));
 * expect(resOptToOptRes(ok(none()))).toStrictEqual(none());
 * expect(resOptToOptRes(err("hoge"))).toStrictEqual(some(err("hoge")));
 * ```
 */
export const resOptToOptRes = <E, T>(
    resOpt: Result<E, Option<T>>,
): Option<Result<E, T>> => {
    if (isErr(resOpt)) {
        return some(resOpt);
    }
    if (isSome(resOpt[1])) {
        return some(ok(resOpt[1][1]));
    }
    return none();
};

/**
 * A success return type of {@link Result.collect : `Result.collect`}.
 */
export type CollectSuccessValue<R extends readonly Result<unknown, unknown>[]> =
    R extends readonly []
        ? never[]
        : {
              -readonly [K in keyof R]: R[K] extends Result<unknown, infer T>
                  ? T
                  : never;
          };

/**
 * An error return type of {@link Result.collect : `Result.collect`}.
 */
export type CollectErrorValue<R extends readonly Result<unknown, unknown>[]> =
    R[number] extends Err<infer E>
        ? E
        : R[number] extends Ok<unknown>
          ? never
          : R[number] extends Result<infer E, unknown>
            ? E
            : never;

/**
 * A return type of {@link Result.collect : `Result.collect`}.
 */
export type CollectReturn<R extends readonly Result<unknown, unknown>[]> =
    Result<CollectErrorValue<R>, CollectSuccessValue<R>>;

/**
 * Transforms the list of {@link Result.Result | `Results`}s into success values or the first error.
 *
 * @param results - The list of {@link Result.Result | `Results`}s.
 * @returns Success values or the first error.
 */
export const collect = <const R extends readonly Result<unknown, unknown>[]>(
    results: R,
): CollectReturn<R> => {
    const successes: unknown[] = [];
    for (const res of results) {
        if (isErr(res)) {
            return res as CollectReturn<R>;
        }
        successes.push(res[1]);
    }
    return ok(successes) as CollectReturn<R>;
};

/**
 * Inspects the success value of a {@link Result.Result | `Result`} and returns as is.
 *
 * @param inspector - The function to get a success value.
 * @returns The original one.
 */
export const inspect =
    <T>(inspector: (value: T) => void) =>
    <E>(res: Result<E, T>): Result<E, T> => {
        if (isOk(res)) {
            inspector(res[1]);
        }
        return res;
    };

/**
 * Applies the function to another value on `Result`.
 *
 * @param fnRes - The function to apply contained by `Result`.
 * @param tRes - The result to be applied.
 * @returns The applied result.
 */
export const apply =
    <E, T, U>(fnRes: Result<E, (t: T) => U>) =>
    (tRes: Result<E, T>): Result<E, U> =>
        andThen((fn: (t: T) => U) => map(fn)(tRes))(fnRes);

/**
 * Fold the success data contained by `Result` from right side.
 *
 * @param folder - The folder to fold the data in `Result`.
 * @param init - The initial seed to fold.
 * @param data - The result to be folded.
 * @returns The folded value.
 */
export const foldR: <X, A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Result<X, A>) => B = (folder) => (init) => (res) => {
    if (isErr(res)) {
        return init;
    }
    return folder(res[1])(init);
};
/**
 * Traverses the data contained by `Result` with `visitor`.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param visitor - The visitor returns `F`.
 * @param res - The result to traverse.
 * @returns The traversed data.
 */
export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    <X>(res: Result<X, A>): Get1<F, Result<X, B>> => {
        if (isErr(res)) {
            return app.pure(err(res[1]));
        }
        return app.map(ok)(visitor(res[1]));
    };

export const bifoldR =
    <A, C>(aFolder: (a: A) => (c: C) => C) =>
    <B>(bFolder: (b: B) => (c: C) => C) =>
    (init: C) =>
    (data: Result<A, B>): C =>
        either((a: A) => aFolder(a)(init))((b: B) => bFolder(b)(init))(data);

export const bitraverse =
    <F>(app: Applicative<F>) =>
    <A, C>(f: (a: A) => Get1<F, C>) =>
    <B, D>(g: (b: B) => Get1<F, D>) =>
    (data: Result<A, B>): Get1<F, Result<C, D>> => {
        if (isErr(data)) {
            return app.map((c: C) => err(c))(f(data[1]));
        }
        return app.map((d: D) => ok(d))(g(data[1]));
    };

export interface ResultHkt extends Hkt2 {
    readonly type: Result<this["arg2"], this["arg1"]>;
}

/**
 * The `SemiGroupal` instance for `Result<E, _>`.
 */
export const semiGroupal = <E>(): SemiGroupal<Apply2Only<ResultHkt, E>> => ({
    product,
});

/**
 * The `Pure` instance for `Result<E, _>`.
 */
export const pure = <E>(): Pure<Apply2Only<ResultHkt, E>> => ({ pure: ok });

/**
 * Creates the instance of `Monoid` from the default error.
 *
 * @param error - The default error.
 * @returns The instance of `Monoid` for `Result<E, T>`.
 */
export const monoid = <E, T>(error: E): Monoid<Result<E, T>> => ({
    combine: (l, r) => or(l)(r),
    identity: err(error),
    [semiGroupSymbol]: true,
});

/**
 * The instance of `Functor` for `Result<E, _>`.
 */
export const functor = <E>(): Functor<Apply2Only<ResultHkt, E>> => ({ map });

/**
 * The instance of `Applicative` for `Result<E, _>`.
 */
export const applicative = <E>(): Applicative<Apply2Only<ResultHkt, E>> => ({
    pure: ok,
    map,
    apply,
});

/**
 * The instance of `Monad` for `Result<E, _>`.
 */
export const monad = <E>(): Monad<Apply2Only<ResultHkt, E>> => ({
    pure: ok,
    map,
    flatMap: andThen,
    apply,
});

/**
 * The instance of `Monad` for `Traversable<E, _>`.
 */
export const traversable = <E>(): Traversable<Apply2Only<ResultHkt, E>> => ({
    map,
    foldR,
    traverse,
});

/**
 * The instance of `TraversableMonad` for `Result<E, _>`.
 */
export const traversableMonad = <E>(): TraversableMonad<
    Apply2Only<ResultHkt, E>
> => ({
    pure: ok,
    map,
    flatMap: andThen,
    apply,
    foldR,
    traverse,
});

/**
 * The instance of `Bifunctor` for `Result<_, _>`.
 */
export const bifunctor: Bifunctor<ResultHkt> = { biMap };
/**
 * The instance of `Bifoldable` for `Result<_, _>`.
 */
export const bifoldable: Bifoldable<ResultHkt> = {
    bifoldR,
};

/**
 * The instance of `Bitraversable` for `Result<_, _>`.
 */
export const bitraversable: Bitraversable<ResultHkt> = {
    ...bifunctor,
    ...bifoldable,
    bitraverse,
};

/**
 * The `ErrorMonad` instance for `Result<E, _>`.
 */
export const errorMonad = <E>(): ErrorMonad<Apply2Only<ResultHkt, E>> => ({
    ...monad<E>(),
    context: (context) =>
        mapErr((err) => new Error(`Error: ${context}`, { cause: err })),
    withContext: (fn) =>
        mapErr((err) => new Error(`Error: ${fn()}`, { cause: err })),
});

export const ifErr = <E, F, T>(): Optic<Result<E, T>, Result<F, T>, E, F> =>
    newPrism<F, Result<F, T>>(err)(
        either<E, Result<Result<F, T>, E>>(ok)((t) => err(ok(t))),
    );
export const ifOk = <E, T, U>(): Optic<Result<E, T>, Result<E, U>, T, U> =>
    newPrism<U, Result<E, U>>(ok)(
        either<E, Result<Result<E, U>, T>>((e) => err(err(e)))(ok),
    );

export const enc =
    <E>(encE: Encoder<E>) =>
    <T>(encT: Encoder<T>): Encoder<Result<E, T>> =>
        encSum({
            [errSymbol]: ([, err]: Err<E>) => encE(err),
            [okSymbol]: ([, ok]: Ok<T>) => encT(ok),
        })(([key]) => key)((type) => encU8(type === errSymbol ? 0 : 1));
export const dec =
    <E>(decE: Decoder<E>) =>
    <T>(decT: Decoder<T>): Decoder<Result<E, T>> =>
        decSum(decU8())<Result<E, T>>([
            mapDecoder(err)(decE),
            mapDecoder(ok)(decT),
        ]);
