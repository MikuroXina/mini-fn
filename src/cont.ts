import * as Identity from "./identity.js";

import type { Monad1, Monad2 } from "./type-class/monad.js";
import { absurd, constant } from "./func.js";

import type { GetHktA1 } from "./hkt.js";
import type { MonadPromise1 } from "./promise/monad.js";

export interface ContT<R, M, A> {
    (callback: (a: A) => GetHktA1<M, R>): GetHktA1<M, R>;
}

export const runContT: <R, M, A>(
    contT: ContT<R, M, A>,
) => (callback: (a: A) => GetHktA1<M, R>) => GetHktA1<M, R> = Identity.id;
export const evalContT =
    <M>(monad: Monad1<M>) =>
    <R>(contT: ContT<R, M, R>): GetHktA1<M, R> =>
        contT(monad.pure);
export const mapContT =
    <M, R>(mapper: (mr: GetHktA1<M, R>) => GetHktA1<M, R>) =>
    <A>(contT: ContT<R, M, A>): ContT<R, M, A> =>
    (fn) =>
        contT((a) => mapper(fn(a)));
export const withContT =
    <M, A, B, R>(callback: (fn: (b: B) => GetHktA1<M, R>) => (a: A) => GetHktA1<M, R>) =>
    (contT: ContT<R, M, A>): ContT<R, M, B> =>
    (fn) =>
        contT(callback(fn));

export const callCC =
    <R, M, A, B>(continuation: (fn: (a: A) => ContT<R, M, B>) => ContT<R, M, A>): ContT<R, M, A> =>
    (c): GetHktA1<M, R> =>
        continuation(
            (a): ContT<R, M, B> =>
                (_fn): GetHktA1<M, R> =>
                    c(a),
        )(c);

export const resetT =
    <M>(monad: Monad1<M>) =>
    <R, S>(contT: ContT<R, M, R>): ContT<S, M, R> =>
    (c) =>
        monad.flatMap(c)(evalContT(monad)(contT));
export const shiftT =
    <M>(monad: Monad1<M>) =>
    <R, A>(continuation: (callback: (a: A) => GetHktA1<M, R>) => ContT<R, M, R>): ContT<R, M, A> =>
    (fn) =>
        evalContT(monad)(continuation(fn));

export const liftLocal =
    <M>(monad: Monad1<M>) =>
    <S>(ask: GetHktA1<M, S>) =>
    <R>(local: (callback: (s: S) => S) => (mr: GetHktA1<M, R>) => GetHktA1<M, R>) =>
    (f: (s: S) => S) =>
    <A>(m: ContT<R, M, A>): ContT<R, M, A> =>
    (c) =>
        monad.flatMap((r: S) => local(f)(m((x) => local(constant(r))(c(x)))))(ask);

export type Cont<R, A> = ContT<R, Identity.IdentityHktKey, A>;

export const runCont: <R, A>(cont: Cont<R, A>) => (fn: (a: A) => R) => R = runContT;
export const evalCont: <R>(cont: Cont<R, R>) => R = evalContT(Identity.monad);
export const mapCont: <R>(mapper: (r: R) => R) => <A>(cont: Cont<R, A>) => Cont<R, A> = mapContT;
export const withCont: <A, B, R>(
    callback: (fn: (b: B) => R) => (a: A) => R,
) => (cont: Cont<R, A>) => Cont<R, B> = withContT;

export const pure =
    <R, M, A>(a: A): ContT<R, M, A> =>
    (fn) =>
        fn(a);
export const map =
    <A, B>(mapper: (a: A) => B) =>
    <R, M>(cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        cont((a) => c(mapper(a)));
export const flatMap =
    <R, M, A, B>(mapper: (a: A) => ContT<R, M, B>) =>
    (cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        cont((a) => mapper(a)(c));
export const apply =
    <R, M, A, B>(app: ContT<R, M, (a: A) => B>) =>
    (cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        app((g) => cont((a) => c(g(a))));
export const product =
    <R, M, A>(ca: ContT<R, M, A>) =>
    <B>(cb: ContT<R, M, B>): ContT<R, M, [A, B]> =>
    (c) =>
        ca((a) => cb((b) => c([a, b])));

export const lift =
    <M>(monad: Monad1<M>) =>
    <R, A>(m: GetHktA1<M, A>): ContT<R, M, A> =>
    (mapper) =>
        monad.flatMap(mapper)(m);

export const liftPromise =
    <M>(monad: MonadPromise1<M>) =>
    <R, A>(p: Promise<A>): ContT<R, M, A> =>
        lift(monad)(monad.liftPromise(p));

export const when =
    (cond: boolean) =>
    <R>(cont: Cont<R, []>): Cont<R, []> =>
        cond ? cont : pure([]);
export const unless =
    (cond: boolean) =>
    <R>(cont: Cont<R, []>): Cont<R, []> =>
        cond ? pure([]) : cont;
export const guard = <R>(cond: boolean): Cont<R, []> => (cond ? pure([]) : absurd);

declare const contNominal: unique symbol;
export type ContHktKey = typeof contNominal;

declare const contTNominal: unique symbol;
export type ContTHktKey = typeof contTNominal;

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [contNominal]: Cont<A1, A2>;
    }
    interface HktDictA3<A1, A2, A3> {
        [contTNominal]: ContT<A1, A2, A3>;
    }
}

export const monad: Monad2<ContHktKey> = {
    pure,
    map,
    flatMap,
    apply,
    product,
};
