import { absurd, id } from "./func.js";

import type { Monad1 } from "./type-class/monad.js";
import type { MonadCont } from "./cont/monad.js";
import type { MonadPromise1 } from "./promise/monad.js";
import type { Monoid } from "./type-class/monoid.js";

declare const promiseNominal: unique symbol;
export type PromiseHktKey = typeof promiseNominal;

export const pure = Promise.resolve;

export const product =
    <A>(a: Promise<A>) =>
    <B>(b: Promise<B>): Promise<[A, B]> =>
        Promise.all([a, b]);

export const map: <T1, U1>(fn: (t: T1) => U1) => (t: Promise<T1>) => Promise<U1> = (f) => (t) =>
    t.then(f);

export const flatMap: <T1, U1>(a: (t: T1) => Promise<U1>) => (t: Promise<T1>) => Promise<U1> =
    (f) => (t) =>
        t.then(f);

export const apply: <T1, U1>(fn: Promise<(t: T1) => U1>) => (t: Promise<T1>) => Promise<U1> =
    (f) => (t) =>
        t.then((value) => f.then((func) => func(value)));

export const callCC = <A, B>(
    continuation: (callback: (a: A) => Promise<B>) => Promise<A>,
): Promise<A> =>
    new Promise((resolve, reject) => {
        resolve(
            continuation((err) => {
                reject(err);
                return absurd();
            }),
        );
    });

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [promiseNominal]: Promise<A1>;
    }
}

export const monoid = <T>(identity: T): Monoid<Promise<T>> => ({
    combine: (l, r) => l.then(() => r),
    identity: Promise.resolve(identity),
});

export const monad: Monad1<PromiseHktKey> = {
    product,
    pure,
    map,
    flatMap: flatMap,
    apply,
};

export const monadCont: MonadCont<PromiseHktKey> = {
    ...monad,
    callCC: callCC,
};

export const monadPromise: MonadPromise1<PromiseHktKey> = {
    ...monad,
    liftPromise: id,
};
