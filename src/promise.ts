import type { MonadCont } from "./cont/monad.ts";
import { absurd, id } from "./func.ts";
import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.ts";
import type { MonadPromise } from "./promise/monad.ts";
import type { Apply } from "./type-class/apply.ts";
import type { Applicative } from "./type-class/applicative.ts";
import { type FlatMap, flatten } from "./type-class/flat-map.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import type { SemiGroupal } from "./type-class/semi-groupal.ts";
import type { Traversable } from "./type-class/traversable.ts";
import type { TraversableMonad } from "./type-class/traversable-monad.ts";

/**
 * Monad transformer `PromiseT`, a generic form of `Promise`.
 */
export type PromiseT<M, A> = Promise<Get1<M, A>>;

/**
 * Wraps the value of monad into a `Promise`. This is an alias of `Promise.resolve`.
 */
export const pureT: <M, A>(ma: Get1<M, A>) => PromiseT<M, A> = Promise.resolve;

/**
 * Makes two `PromiseT`s into a `PromiseT` of tuple.
 *
 * @param semi - The instance for `SemiGroupal` of `M`.
 * @param a - The left-side promise.
 * @param b - The right-side promise.
 * @returns The promise of product.
 */
export const productT =
    <M>(semi: SemiGroupal<M>) =>
    <A>(a: PromiseT<M, A>) =>
    <B>(b: PromiseT<M, B>): PromiseT<M, [A, B]> =>
        a.then((ma) => b.then(semi.product(ma)));

/**
 * Maps item in a `PromiseT` by `fn`.
 *
 * @param f - The instance for `Functor` of `M`.
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const mapT =
    <M>(f: Functor<M>) =>
    <T, U>(fn: (t: T) => U) =>
    (t: PromiseT<M, T>): PromiseT<M, U> => t.then(f.map(fn));

/**
 * Maps and flatten an item of `PromiseT` by `fn`.
 *
 * @param m - The instance of `Traversable` and `FlatMap` for `M`.
 * @param fn - A function to transform `T` into `PromiseT<M, U>`.
 * @param t - A promise to be transformed.
 * @returns The transformed promise.
 */
export const flatMapT =
    <M>(m: Traversable<M> & FlatMap<M>) =>
    <T, U>(fn: (t: T) => PromiseT<M, U>) =>
    (t: PromiseT<M, T>): PromiseT<M, U> =>
        t.then(m.traverse(applicative)(fn))
            .then(flatten(m));

/**
 * Applies the function in a `PromiseT`.
 *
 * @param fn - A `PromiseT` which contains function.
 * @param t - A `PromiseT` to be transformed.
 * @returns The applied `PromiseT`.
 */
export const applyT =
    <M>(m: Apply<M>) =>
    <T, U>(fn: PromiseT<M, (t: T) => U>) =>
    (t: PromiseT<M, T>): PromiseT<M, U> =>
        t.then((mt) => fn.then((mfn) => m.apply(mfn)(mt)));

export interface PromiseTHkt extends Hkt2 {
    readonly type: PromiseT<this["arg2"], this["arg1"]>;
}

/**
 * Returns the instance of `Monoid` about concatenating the promise computations.
 *
 * @param m - The instance of `Traversable` and `Monad` for `M`.
 * @param identity - The identity of `T` that used as a default value.
 * @returns The instance of `Monoid` for `PromiseT<M, T>`.
 */
export const monoidT =
    <M>(m: Traversable<M> & Monad<M>) =>
    <T>(identity: T): Monoid<PromiseT<M, T>> => ({
        identity: Promise.resolve(m.pure(identity)),
        combine: (l, r) => flatMapT(m)((mr: T) => mapT(m)(() => mr)(l))(r),
        [semiGroupSymbol]: true,
    });

/**
 * @param m - The instance of `Functor` for `M`.
 * @returns The instance of `Functor` for `PromiseT<M, _>`.
 */
export const functorT = <M>(
    m: Functor<M>,
): Functor<Apply2Only<PromiseTHkt, M>> => ({
    map: mapT(m),
});

/**
 * @param m - The instance of `Functor` and `Apply` for `M`.
 * @returns The instance of `Applicative` for `PromiseT<M, _>`.
 */
export const applicativeT = <M>(
    m: Functor<M> & Apply<M>,
): Applicative<Apply2Only<PromiseTHkt, M>> => ({
    pure,
    map: mapT(m),
    apply: applyT(m),
});

/**
 * @param m - The instance of `Traversable`, `Apply` and `FlatMap` for `M`.
 * @returns The instance of `Monad` for `PromiseT<M, _>`.
 */
export const monadT = <M>(
    m: TraversableMonad<M>,
): Monad<Apply2Only<PromiseTHkt, M>> => ({
    pure,
    map: mapT(m),
    apply: applyT(m),
    flatMap: flatMapT(m),
});

/**
 * Wraps the value into `Promise`. This is the alias of `Promise.resolve`.
 */
export const pure = Promise.resolve;

/**
 * Makes two promises into a promise of tuple.
 *
 * @param a - The left-side promise.
 * @param b - The right-side promise.
 * @returns The promise of product.
 */
export const product =
    <A>(a: Promise<A>) => <B>(b: Promise<B>): Promise<[A, B]> =>
        Promise.all([a, b]);

/**
 * Maps an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const map: <T, U>(fn: (t: T) => U) => (t: Promise<T>) => Promise<U> =
    (f) => (t) => t.then(f);

/**
 * Maps and flatten an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const flatMap: <T, U>(
    fn: (t: T) => Promise<U>,
) => (t: Promise<T>) => Promise<U> = (f) => (t) => t.then(f);

/**
 * Applies the function in promise.
 *
 * @param fn - The promise of function.
 * @param t - The promise to be transformed.
 * @returns The applied promise.
 */
export const apply: <T, U>(
    fn: Promise<(t: T) => U>,
) => (t: Promise<T>) => Promise<U> = (f) => (t) =>
    t.then((value) => f.then((func) => func(value)));

/**
 * Transform the continuation-passing style into the promise. The parameter for `computation` is `continuation` error handle which aborts the computation.
 *
 * @param computation - The computation about `Promise`.
 * @returns The transformed promise.
 */
export const callCC = <A, B>(
    computation: (continuation: (a: A) => Promise<B>) => Promise<A>,
): Promise<A> =>
    new Promise((resolve, reject) => {
        resolve(
            computation((err) => {
                reject(err);
                return absurd();
            }),
        );
    });

export interface PromiseHkt extends Hkt1 {
    readonly type: Promise<this["arg1"]>;
}

/**
 * Returns the instance of `Monoid` about concatenating the promise computations.
 *
 * @param identity - The identity of `T` that used as a default value.
 * @returns The instance of `Monoid` for `Promise<T>`.
 */
export const monoid = <T>(identity: T): Monoid<Promise<T>> => ({
    combine: (l, r) => l.then(() => r),
    identity: Promise.resolve(identity),
    [semiGroupSymbol]: true,
});

/**
 * The instance of `Functor` for `Promise`.
 */
export const functor: Functor<PromiseHkt> = { map };

/**
 * The instance of `Applicative` for `Promise`.
 */
export const applicative: Applicative<PromiseHkt> = {
    pure,
    map,
    apply,
};

/**
 * The instance of `Monad` for `Promise`.
 */
export const monad: Monad<PromiseHkt> = {
    pure,
    map,
    flatMap: flatMap,
    apply,
};

/**
 * The instance of `MonadCont` for `Promise`.
 */
export const monadCont: MonadCont<PromiseHkt> = {
    ...monad,
    callCC: callCC,
};

/**
 * The instance of `MonadPromise` for `Promise`.
 */
export const monadPromise: MonadPromise<PromiseHkt> = {
    ...monad,
    liftPromise: id,
};
