import type { Functor2 } from "./type-class/functor";
import type { Monad2 } from "./type-class/monad";
import type { Profunctor2 } from "./type-class/profunctor";

declare const readerNominal: unique symbol;
export type ReaderHktKey = typeof readerNominal;

export interface Reader<in R, out A> {
    (request: R): A;
}

export const ask =
    <R>(): Reader<R, R> =>
    (x: R) =>
        x;
export const run =
    <R, A>(r: Reader<R, A>) =>
    (req: R) =>
        r(req);
export const withReader =
    <R, S>(map: (r: R) => S) =>
    <A>(r: Reader<S, A>): Reader<R, A> =>
    (req: R) =>
        r(map(req));

export const map =
    <T, U>(f: (t: T) => U) =>
    <R>(r: Reader<R, T>): Reader<R, U> =>
    (req) =>
        f(r(req));
export const applyDouble =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    <S>(s: Reader<S, A>): Reader<R & S, B> =>
    (rs) =>
        r(rs)(s(rs));
export const apply =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    (s: Reader<R, A>): Reader<R, B> =>
        applyDouble(r)(s);
export const pure =
    <R, A>(a: A): Reader<R, A> =>
    () =>
        a;
export const flatMapDouble =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    <S>(r: Reader<S, A>): Reader<R & S, B> =>
    (req) =>
        f(r(req))(req);
export const flatMap =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    (r: Reader<R, A>): Reader<R, B> =>
        flatMapDouble(f)(r);
export const flattenDouble =
    <A, R, S>(r: Reader<S, Reader<R, A>>): Reader<R & S, A> =>
    (rs: R & S) =>
        r(rs)(rs);
export const flatten = <R, A>(r: Reader<R, Reader<R, A>>): Reader<R, A> => flattenDouble(r);

export const applyFirstDouble =
    <R, A>(r: Reader<R, A>) =>
    <S, B>(_s: Reader<S, B>): Reader<R & S, A> =>
    (rs) =>
        r(rs);
export const applySecondDouble =
    <R, A>(_r: Reader<R, A>) =>
    <S, B>(s: Reader<S, B>): Reader<R & S, B> =>
        s;
export const flatMapFirstDouble =
    <R, A>(r: Reader<R, A>) =>
    <S, B>(_f: (a: A) => Reader<S, B>): Reader<R & S, A> =>
    (rs) =>
        r(rs);

export const compose =
    <T, U>(r: Reader<T, U>) =>
    <V>(s: Reader<U, V>): Reader<T, V> =>
    (t) =>
        s(r(t));
export const diMap =
    <A, B>(f: (a: A) => B) =>
    <C, D>(g: (t: C) => D) =>
    (r: Reader<D, A>): Reader<C, B> =>
    (t) =>
        f(r(g(t)));

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [readerNominal]: Reader<A1, A2>;
    }
}

export const functor: Functor2<ReaderHktKey> = { map };
export const monad: Monad2<ReaderHktKey> = { pure, map, flatMap, apply };
export const profunctor: Profunctor2<ReaderHktKey> = { diMap };
