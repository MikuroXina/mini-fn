import * as Identity from "./identity";

import type { Monad1, Monad2 } from "./type-class/monad";

import type { Functor2 } from "./type-class/functor";
import type { GetHktA1 } from "./hkt";
import type { Profunctor2 } from "./type-class/profunctor";

export interface ReaderT<R, M, A> {
    (record: R): GetHktA1<M, A>;
}

export const mapReaderT =
    <M, N, A, B>(fn: (ma: GetHktA1<M, A>) => GetHktA1<N, B>) =>
    <R>(r: ReaderT<R, M, A>): ReaderT<R, N, B> =>
    (record: R) =>
        fn(r(record));
export const withReaderT =
    <R1, R2>(mapper: (record: R1) => R2) =>
    <M, A>(r: ReaderT<R2, M, A>): ReaderT<R1, M, A> =>
    (record: R1) =>
        r(mapper(record));

declare const readerNominal: unique symbol;
export type ReaderHktKey = typeof readerNominal;

export type Reader<R, A> = ReaderT<R, Identity.IdentityHktKey, A>;

export const run =
    <R, A>(r: Reader<R, A>) =>
    (req: R) =>
        r(req);

export const askM = <R, S>(m: Monad1<S>): GetHktA1<S, Reader<R, R>> => m.pure((x) => x);
export const ask = <R>(): Reader<R, R> => askM<R, Identity.IdentityHktKey>(Identity.monad);
export const local =
    <T, U>(f: (t: T) => U) =>
    <A>(ma: Reader<U, A>): Reader<T, A> =>
    (t) =>
        ma(f(t));

export const product =
    <R, A>(a: Reader<R, A>) =>
    <B>(b: Reader<R, B>): Reader<R, [A, B]> =>
    (r: R) =>
        [a(r), b(r)];

export const withReader = <R, A>(reader: (a: R) => A): Reader<R, A> => {
    const askApplied = ask<R>();
    return (req: R) => reader(askApplied(req));
};

export const map =
    <T, U>(f: (t: T) => U) =>
    <R>(r: Reader<R, T>): Reader<R, U> =>
    (req) =>
        f(r(req));
export const applyWeak =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    <S>(s: Reader<S, A>): Reader<R & S, B> =>
    (rs) =>
        r(rs)(s(rs));
export const apply =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    (s: Reader<R, A>): Reader<R, B> =>
        applyWeak(r)(s);
export const pure =
    <R, A>(a: A): Reader<R, A> =>
    () =>
        a;
export const flatMapWeak =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    <S>(r: Reader<S, A>): Reader<R & S, B> =>
    (req) =>
        f(r(req))(req);
export const flatMap =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    (r: Reader<R, A>): Reader<R, B> =>
        flatMapWeak(f)(r);
export const flattenWeak =
    <A, R, S>(r: Reader<S, Reader<R, A>>): Reader<R & S, A> =>
    (rs: R & S) =>
        r(rs)(rs);
export const flatten = <R, A>(r: Reader<R, Reader<R, A>>): Reader<R, A> => flattenWeak(r);

export const applyFirstWeak =
    <R, A>(r: Reader<R, A>) =>
    <S, B>(_s: Reader<S, B>): Reader<R & S, A> =>
    (rs) =>
        r(rs);
export const applySecondWeak =
    <R, A>(_r: Reader<R, A>) =>
    <S, B>(s: Reader<S, B>): Reader<R & S, B> =>
        s;
export const flatMapFirstWeak =
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
export const monad: Monad2<ReaderHktKey> = {
    product,
    pure,
    map,
    flatMap,
    apply,
};
export const profunctor: Profunctor2<ReaderHktKey> = { diMap };
