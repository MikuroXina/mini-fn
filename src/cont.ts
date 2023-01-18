import * as Identity from "./identity.js";

import type { Apply2Only, Apply3Only, Get1, Hkt1, Hkt2, Hkt3 } from "./hkt.js";
import { absurd, constant } from "./func.js";

import type { Monad } from "./type-class/monad.js";
import type { MonadPromise1 } from "./promise/monad.js";

export interface ContT<R, M, A> {
    (callback: (a: A) => Get1<M, R>): Get1<M, R>;
}

export const runContT: <R, M, A>(
    contT: ContT<R, M, A>,
) => (callback: (a: A) => Get1<M, R>) => Get1<M, R> = Identity.id;
export const evalContT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <R>(contT: ContT<R, M, R>): Get1<M, R> =>
        contT(monad.pure);
export const mapContT =
    <M, R>(mapper: (mr: Get1<M, R>) => Get1<M, R>) =>
    <A>(contT: ContT<R, M, A>): ContT<R, M, A> =>
    (fn) =>
        contT((a) => mapper(fn(a)));
export const withContT =
    <M, A, B, R>(callback: (fn: (b: B) => Get1<M, R>) => (a: A) => Get1<M, R>) =>
    (contT: ContT<R, M, A>): ContT<R, M, B> =>
    (fn) =>
        contT(callback(fn));

export const callCC =
    <R, M, A, B>(continuation: (fn: (a: A) => ContT<R, M, B>) => ContT<R, M, A>): ContT<R, M, A> =>
    (c): Get1<M, R> =>
        continuation(
            (a): ContT<R, M, B> =>
                (_fn): Get1<M, R> =>
                    c(a),
        )(c);

export const resetT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <R, S>(contT: ContT<R, M, R>): ContT<S, M, R> =>
    (c) =>
        monad.flatMap(c)(evalContT(monad)(contT));
export const shiftT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <R, A>(continuation: (callback: (a: A) => Get1<M, R>) => ContT<R, M, R>): ContT<R, M, A> =>
    (fn) =>
        evalContT(monad)(continuation(fn));

export const liftLocal =
    <M extends Hkt1>(monad: Monad<M>) =>
    <S>(ask: Get1<M, S>) =>
    <R>(local: (callback: (s: S) => S) => (mr: Get1<M, R>) => Get1<M, R>) =>
    (f: (s: S) => S) =>
    <A>(m: ContT<R, M, A>): ContT<R, M, A> =>
    (c) =>
        monad.flatMap((r: S) => local(f)(m((x) => local(constant(r))(c(x)))))(ask);

export type Cont<R, A> = ContT<R, Identity.IdentityHkt, A>;

export const runCont: <R, A>(cont: Cont<R, A>) => (fn: (a: A) => R) => R = runContT;
export const evalCont: <R>(cont: Cont<R, R>) => R = evalContT(Identity.monad);
export const mapCont: <R>(mapper: (r: R) => R) => <A>(cont: Cont<R, A>) => Cont<R, A> = mapContT;
export const withCont: <A, B, R>(
    callback: (fn: (b: B) => R) => (a: A) => R,
) => (cont: Cont<R, A>) => Cont<R, B> = withContT;

export const reset: <R, S>(contT: Cont<R, R>) => Cont<S, R> = resetT(Identity.monad);
export const shift: <R, A>(continuation: (callback: (a: A) => R) => Cont<R, R>) => Cont<R, A> =
    shiftT(Identity.monad);

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
    <M extends Hkt1>(monad: Monad<M>) =>
    <R, A>(m: Get1<M, A>): ContT<R, M, A> =>
    (mapper) =>
        monad.flatMap(mapper)(m);

export const liftPromise =
    <M extends Hkt1>(monad: MonadPromise1<M>) =>
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

export interface ContHkt extends Hkt2 {
    readonly type: Cont<this["arg2"], this["arg1"]>;
}

export interface ContTHkt extends Hkt3 {
    readonly type: ContT<this["arg3"], this["arg2"], this["arg1"]>;
}

export const monad = <R, M>(): Monad<Apply3Only<ContTHkt, R> & Apply2Only<ContTHkt, M>> => ({
    pure,
    map,
    flatMap,
    apply,
    product,
});
