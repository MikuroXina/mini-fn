import { absurd, id } from "./func.js";

import type { Hkt1 } from "./hkt.js";
import type { Monad } from "./type-class/monad.js";
import type { MonadCont } from "./cont/monad.js";
import type { MonadPromise1 } from "./promise/monad.js";
import type { Monoid } from "./type-class/monoid.js";

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

export interface PromiseHkt extends Hkt1 {
    readonly type: Promise<this["arg1"]>;
}

export const monoid = <T>(identity: T): Monoid<Promise<T>> => ({
    combine: (l, r) => l.then(() => r),
    identity: Promise.resolve(identity),
});

export const monad: Monad<PromiseHkt> = {
    pure,
    map,
    flatMap: flatMap,
    apply,
};

export const monadCont: MonadCont<PromiseHkt> = {
    ...monad,
    callCC: callCC,
};

export const monadPromise: MonadPromise1<PromiseHkt> = {
    ...monad,
    liftPromise: id,
};
