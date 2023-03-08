import type { MonadCont } from "./cont/monad.js";
import { absurd, id } from "./func.js";
import type { Hkt1 } from "./hkt.js";
import type { MonadPromise } from "./promise/monad.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";

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
    <A>(a: Promise<A>) =>
    <B>(b: Promise<B>): Promise<[A, B]> =>
        Promise.all([a, b]);

/**
 * Maps an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const map: <T, U>(fn: (t: T) => U) => (t: Promise<T>) => Promise<U> = (f) => (t) =>
    t.then(f);

/**
 * Maps and flatten an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const flatMap: <T, U>(fn: (t: T) => Promise<U>) => (t: Promise<T>) => Promise<U> =
    (f) => (t) =>
        t.then(f);

/**
 * Applies the function in promise.
 *
 * @param fn - The promise of function.
 * @param t - The promise to be transformed.
 * @returns The applied promise.
 */
export const apply: <T, U>(fn: Promise<(t: T) => U>) => (t: Promise<T>) => Promise<U> =
    (f) => (t) =>
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
});

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
