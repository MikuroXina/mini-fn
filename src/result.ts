import { Eq, fromEquality } from "./type-class/eq.js";
import type { Get1, Hkt1, Hkt2 } from "./hkt.js";
import { Option, isSome, none, toArray as optionToArray, some } from "./option.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { Ordering, greater, less } from "./ordering.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";

import type { Applicative } from "./type-class/applicative.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Traversable } from "./type-class/traversable.js";

const okSymbol = Symbol("ResultOk");
const errSymbol = Symbol("ResultErr");

export type Ok<T> = readonly [typeof okSymbol, T];
export type Err<E> = readonly [typeof errSymbol, E];

export type Result<E, T> = Err<E> | Ok<T>;

export const ok = <E, T>(v: T): Result<E, T> => [okSymbol, v];
export const err = <E, T>(e: E): Result<E, T> => [errSymbol, e];

export const isOk = <E, T>(res: Result<E, T>): res is Ok<T> => res[0] === okSymbol;
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

export const either =
    <E, R>(g: (e: E) => R) =>
    <T>(f: (t: T) => R) =>
    (res: Result<E, T>): R =>
        isOk(res) ? f(res[1]) : g(res[1]);

export const flatten = <E, T>(resRes: Result<E, Result<E, T>>): Result<E, T> =>
    isOk(resRes) ? resRes[1] : err(resRes[1]);
export const mergeOkErr = <T>(res: Result<T, T>) => res[1];

export const and =
    <U, E>(resB: Result<E, U>) =>
    <T>(resA: Result<E, T>) =>
        isOk(resA) ? resB : resA;
export const andThen =
    <T, U, E>(fn: (t: T) => Result<E, U>) =>
    (resA: Result<E, T>) =>
        isOk(resA) ? fn(resA[1]) : resA;
export const or =
    <E, T>(resB: Result<E, T>) =>
    (resA: Result<E, T>) =>
        isErr(resA) ? resB : resA;
export const orElse =
    <E, T, F>(fn: (error: E) => Result<F, T>) =>
    (resA: Result<E, T>) =>
        isErr(resA) ? fn(resA[1]) : resA;

export const optionOk = <E, T>(res: Result<E, T>): Option<T> => (isOk(res) ? some(res[1]) : none());
export const optionErr = <E, T>(res: Result<E, T>): Option<E> =>
    isErr(res) ? some(res[1]) : none();

export const toString = <E, T>(res: Result<E, T>) =>
    isOk(res) ? `ok(${res[1]})` : `err(${res[1]})`;
export const toArray = <E, T>(res: Result<E, T>) => optionToArray(optionOk(res));

export const map =
    <T, U>(fn: (t: T) => U) =>
    <E>(res: Result<E, T>): Result<E, U> =>
        isOk(res) ? ok(fn(res[1])) : res;
export const mapOr =
    <U>(init: U) =>
    <T>(fn: (t: T) => U) =>
    <E>(res: Result<E, T>): U =>
        isOk(res) ? fn(res[1]) : init;
export const mapOrElse =
    <U>(init: () => U) =>
    <T>(fn: (t: T) => U) =>
    <E>(res: Result<E, T>): U =>
        isOk(res) ? fn(res[1]) : init();

export const mapErr =
    <E, F>(fn: (t: E) => F) =>
    <T>(res: Result<E, T>): Result<F, T> =>
        isErr(res) ? err(fn(res[1])) : res;

export const product =
    <E, A>(aRes: Result<E, A>) =>
    <B>(bRes: Result<E, B>): Result<E, [A, B]> =>
        andThen((a: A) => map((b: B): [A, B] => [a, b])(bRes))(aRes);

export const unwrapOr =
    <T>(init: T) =>
    <E>(res: Result<E, T>) =>
        isOk(res) ? res[1] : init;
export const unwrapOrElse =
    <T>(fn: () => T) =>
    <E>(res: Result<E, T>) =>
        isOk(res) ? res[1] : fn();

export const resOptToOptRes = <E, T>(resOpt: Result<E, Option<T>>): Option<Result<E, T>> => {
    if (isErr(resOpt)) {
        return some(resOpt);
    }
    if (isSome(resOpt[1])) {
        return some(ok(resOpt[1][1]));
    }
    return none();
};

export const apply =
    <T1, T2, U2>(fnRes: Result<T1, (t: T2) => U2>) =>
    (tRes: Result<T1, T2>): Result<T1, U2> =>
        andThen((fn: (t: T2) => U2) => map(fn)(tRes))(fnRes);

export const foldR: <X, A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Result<X, A>) => B = (folder) => (init) => (res) => {
    if (isErr(res)) {
        return init;
    }
    return folder(res[1])(init);
};
export const traverse =
    <F extends Hkt1>(app: Applicative<F>) =>
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

export const monoid = <E, T>(error: E): Monoid<Result<E, T>> => ({
    combine: (l, r) => or(l)(r),
    identity: err(error),
});

export const monad: Monad<ResultHkt> = {
    product,
    pure: ok,
    map,
    flatMap: andThen,
    apply,
};

export const traversable: Traversable<ResultHkt> = {
    map,
    foldR,
    traverse,
};
