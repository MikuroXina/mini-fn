import { Option, none, some, toArray as optionToArray, isSome } from "./option";
import type { Monad2 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";

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

export const flatten = <E, T>(resRes: Result<E, Result<E, T>>): Result<E, T> =>
    isOk(resRes) ? resRes[1] : err(resRes[1]);
export const mergeOkErr = <T>(res: Result<T, T>) => res[1];

export const and =
    <E, T>(resA: Result<E, T>) =>
    <U>(resB: Result<U, E>) =>
        isOk(resA) ? resB : resA;
export const andThen =
    <E, T>(resA: Result<E, T>) =>
    <U>(fn: (t: T) => Result<U, E>) =>
        isOk(resA) ? fn(resA[1]) : resA;
export const or =
    <E, T>(resA: Result<E, T>) =>
    (resB: Result<E, T>) =>
        isErr(resA) ? resB : resA;
export const orElse =
    <E, T>(resA: Result<E, T>) =>
    <F>(fn: (err: E) => Result<T, F>) =>
        isErr(resA) ? fn(resA[1]) : resA;

export const toString = <E, T>(res: Result<E, T>) =>
    isOk(res) ? `ok(${res[1]})` : `err(${res[1]})`;
export const toArray = <E, T>(res: Result<E, T>) => optionToArray(optionOk(res));

export const optionOk = <E, T>(res: Result<E, T>): Option<T> => (isOk(res) ? some(res[1]) : none());
export const optionErr = <E, T>(res: Result<E, T>): Option<E> =>
    isErr(res) ? some(res[1]) : none();

export const map =
    <E, T>(res: Result<E, T>) =>
    <U>(fn: (t: T) => U): Result<E, U> =>
        isOk(res) ? ok(fn(res[1])) : res;
export const mapOr =
    <U>(init: U) =>
    <E, T>(res: Result<E, T>) =>
    (fn: (t: T) => U): U =>
        isOk(res) ? fn(res[1]) : init;
export const mapOrElse =
    <U>(init: () => U) =>
    <E, T>(res: Result<E, T>) =>
    (fn: (t: T) => U): U =>
        isOk(res) ? fn(res[1]) : init();

export const mapErr =
    <E, T>(res: Result<E, T>) =>
    <F>(fn: (t: E) => F): Result<F, T> =>
        isErr(res) ? err(fn(res[1])) : res;

export const unwrapOr =
    <T>(init: T) =>
    <E>(res: Result<E, T>) =>
        isOk(res) ? res[1] : init;
export const unwrapOrElse =
    <T>(fn: () => T) =>
    <E>(res: Result<E, T>) =>
        isOk(res) ? res[1] : fn();

export const resOptToOptRes = <E, T>(resOpt: Result<E, Option<T>>): Option<Result<E, T>> =>
    isOk(resOpt) ? (isSome(resOpt[1]) ? some(ok(resOpt[1][1])) : none()) : some(resOpt);

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
    map: (f) => (res) => map(res)(f),
    flatMap: (f) => (res) => flatten(map(res)(f)),
    apply: (fnRes) => (tRes) => isErr(tRes) ? tRes : map(fnRes)((fn) => fn(tRes[1])),
};
