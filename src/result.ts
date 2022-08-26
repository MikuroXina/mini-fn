import type { GetHktA1, HktKeyA1 } from "hkt";
import { Option, isSome, none, toArray as optionToArray, some } from "./option";

import type { Applicative1 } from "type-class/applicative";
import type { Monad2 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";
import type { Traversable2 } from "./type-class/traversable";

const okSymbol = Symbol("ResultOk");
const errSymbol = Symbol("ResultErr");

export type Ok<T> = readonly [typeof okSymbol, T];
export type Err<E> = readonly [typeof errSymbol, E];

declare const resultNominal: unique symbol;
export type ResultHktKey = typeof resultNominal;
export type Result<E, T> = Err<E> | Ok<T>;

export const ok = <E, T>(v: T): Result<E, T> => [okSymbol, v];
export const err = <E, T>(e: E): Result<E, T> => [errSymbol, e];

export const isOk = <E, T>(res: Result<E, T>): res is Ok<T> => res[0] === okSymbol;
export const isErr = <E, T>(res: Result<E, T>): res is Err<E> => res[0] === errSymbol;

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

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [resultNominal]: Result<A1, A2>;
    }
}

export const monoid = <E, T>(error: E): Monoid<Result<E, T>> => ({
    combine: (l, r) => or(l)(r),
    identity: err(error),
});

export const monad: Monad2<ResultHktKey> = {
    pure: ok,
    map,
    flatMap: andThen,
    apply:
        <T1, T2, U2>(fnRes: Result<T1, (t: T2) => U2>) =>
        (tRes: Result<T1, T2>): Result<T1, U2> =>
            andThen((fn: (t: T2) => U2) => map(fn)(tRes))(fnRes),
};

export const traversable: Traversable2<ResultHktKey> = {
    map,
    foldR: (folder) => (init) => (res) => {
        if (isErr(res)) {
            return init;
        }
        return folder(res[1])(init);
    },
    traverse:
        <F extends HktKeyA1>(app: Applicative1<F>) =>
        <A, B>(visiter: (a: A) => GetHktA1<F, B>) =>
        <X>(res: Result<X, A>): GetHktA1<F, Result<X, B>> => {
            if (isErr(res)) {
                return app.pure(err(res[1]));
            }
            return app.map(ok)(visiter(res[1]));
        },
};
