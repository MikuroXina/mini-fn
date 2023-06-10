import type { Get1, Hkt2 } from "./hkt.js";
import { Option, isSome, none, toArray as optionToArray, some } from "./option.js";
import { Ordering, greater, less } from "./ordering.js";
import type { Applicative } from "./type-class/applicative.js";
import { Eq, fromEquality } from "./type-class/eq.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import type { Traversable } from "./type-class/traversable.js";

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
 */
export const isOk = <E, T>(res: Result<E, T>): res is Ok<T> => res[0] === okSymbol;
/**
 * Checks whether the result is an `Err`.
 *
 * @param res - The result to be checked.
 * @returns Whether the result is an `Err`.
 */
export const isErr = <E, T>(res: Result<E, T>): res is Err<E> => res[0] === errSymbol;

export const partialEquality =
    <E, T>({ equalityE, equalityT }: { equalityE: PartialEq<E>; equalityT: PartialEq<T> }) =>
    (l: Result<E, T>, r: Result<E, T>): boolean => {
        if (isErr(l) && isErr(r)) {
            return equalityE.eq(l[1], r[1]);
        }
        if (isOk(l) && isOk(r)) {
            return equalityT.eq(l[1], r[1]);
        }
        return false;
    };
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <E, T>(equalities: { equalityE: Eq<E>; equalityT: Eq<T> }) =>
    partialEquality(equalities);
export const eq = fromEquality(equality);
export const partialCmp =
    <E, T>({ orderE, orderT }: { orderE: PartialOrd<E>; orderT: PartialOrd<T> }) =>
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
export const partialOrd = fromPartialCmp(partialCmp);
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
export const ord = <E, T>(x: { orderE: Ord<E, E>; orderT: Ord<T, T> }) => fromCmp(cmp)(x);

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
 */
export const flatten = <E, T>(resRes: Result<E, Result<E, T>>): Result<E, T> =>
    isOk(resRes) ? resRes[1] : err(resRes[1]);
/**
 * Unwraps the value for the result whose type parameters of are same.
 *
 * @param res - The source result.
 * @returns The contained value.
 */
export const mergeOkErr = <T>(res: Result<T, T>) => res[1];

/**
 * Returns `resB` if `resA` is an `Ok`, otherwise returns the error `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param resB - The second result.
 * @param resA - The first result.
 * @returns `resB` if `resA` is a `Ok`.
 */
export const and =
    <U, E>(resB: Result<E, U>) =>
    <T>(resA: Result<E, T>) =>
        isOk(resA) ? resB : resA;
/**
 * Returns `fn()` if `resA` is an `Ok`, otherwise returns the error `resA`. This is an implementation of `FlatMap`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param fn - The function provides a second result.
 * @param resA - The first result.
 * @returns `fn()` if `resA` is an `Ok`.
 */
export const andThen =
    <T, U, E>(fn: (t: T) => Result<E, U>) =>
    (resA: Result<E, T>) =>
        isOk(resA) ? fn(resA[1]) : resA;
/**
 * Returns `resB` if `resA` is an `Err`, otherwise returns the success `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param resB - The second result.
 * @param resA - The first result.
 * @returns `resA` or `resB`.
 */
export const or =
    <E, T>(resB: Result<E, T>) =>
    (resA: Result<E, T>) =>
        isErr(resA) ? resB : resA;
/**
 * Returns `fn()` if `resA` is an `Err`, otherwise returns the success `resA`. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param fn - The second result.
 * @param resA - The first result.
 * @returns `resA` or `fn()`.
 */
export const orElse =
    <E, T, F>(fn: (error: E) => Result<F, T>) =>
    (resA: Result<E, T>) =>
        isErr(resA) ? fn(resA[1]) : resA;

/**
 * Takes the success value as an optional if the result is an `Ok`, otherwise returns `None`.
 *
 * @param res - The source result.
 * @returns The success value if exists.
 */
export const optionOk = <E, T>(res: Result<E, T>): Option<T> => (isOk(res) ? some(res[1]) : none());
/**
 * Takes the error value as an optional if the result is an `Err`, otherwise returns `None`.
 *
 * @param res - The source result.
 * @returns The error value if exists.
 */
export const optionErr = <E, T>(res: Result<E, T>): Option<E> =>
    isErr(res) ? some(res[1]) : none();

/**
 * Converts into a string for debug. It is not safe for serialization.
 *
 * @param opt - The result value.
 * @returns The string form.
 */
export const toString = <E, T>(res: Result<E, T>) =>
    isOk(res) ? `ok(${res[1]})` : `err(${res[1]})`;
/**
 * Converts into an array.
 *
 * @param opt - The result value.
 * @returns The array which contains zero or one success element.
 */
export const toArray = <E, T>(res: Result<E, T>) => optionToArray(optionOk(res));

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
    <E>(res: Result<E, T>) =>
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
    (res: Result<E, T>) =>
        isOk(res) ? res[1] : fallback(res[1]);

/**
 * Transforms `Result<E, Option<T>>` into `Option<Result<E, T>>` as:
 *
 * - `ok(some(x))` will be mapped to `some(ok(x))`
 * - `ok(none())` will be mapped to `none()`
 * - `err(e)` will be mapped to `some(err(e))`.
 *
 * @param optRes - `Option` containing `Result`.
 * @returns `Result` containing `Option`.
 */
export const resOptToOptRes = <E, T>(resOpt: Result<E, Option<T>>): Option<Result<E, T>> => {
    if (isErr(resOpt)) {
        return some(resOpt);
    }
    if (isSome(resOpt[1])) {
        return some(ok(resOpt[1][1]));
    }
    return none();
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

export interface ResultHkt extends Hkt2 {
    readonly type: Result<this["arg2"], this["arg1"]>;
}

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
 * The instance of `Monad` for `Result<E, _>`.
 */
export const monad: Monad<ResultHkt> = {
    pure: ok,
    map,
    flatMap: andThen,
    apply,
};

/**
 * The instance of `Monad` for `Traversable<E, _>`.
 */
export const traversable: Traversable<ResultHkt> = {
    map,
    foldR,
    traverse,
};
