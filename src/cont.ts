import type { GetHktA1, HktKeyA1 } from "./hkt";

import { Identity } from "./lib";
import type { Monad1 } from "./type-class/monad";

export interface ContT<R, M extends HktKeyA1, A> {
    (fn: (a: A) => GetHktA1<M, R>): GetHktA1<M, R>;
}

export type Cont<R, A> = ContT<R, Identity.IdentityHktKey, A>;

export const pure =
    <R, M extends HktKeyA1, A>(a: A): ContT<R, M, A> =>
    (fn) =>
        fn(a);

export const evaluateT =
    <M extends HktKeyA1>(monad: Monad1<M>) =>
    <R>(cont: ContT<R, M, R>) =>
        cont((x) => monad.pure(x));

export const evaluate: <R>(cont: Cont<R, R>) => R = evaluateT(Identity.monad);

export const map =
    <R, M extends HktKeyA1, A>(mapper: (r: GetHktA1<M, R>) => GetHktA1<M, R>) =>
    (cont: ContT<R, M, A>): ContT<R, M, A> =>
    (fn) =>
        mapper(cont(fn));

export const apply =
    <R, M extends HktKeyA1, A, B>(app: (f: (b: B) => GetHktA1<M, R>) => (a: A) => GetHktA1<M, R>) =>
    (cont: ContT<R, M, A>): ContT<R, M, B> =>
    (fn) =>
        cont(app(fn));

declare const contNominal: unique symbol;
export type ContHktKey = typeof contNominal;

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [contNominal]: Cont<A1, A2>;
    }
}
