import type { Monad1 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";

declare const promiseNominal: unique symbol;
export type PromiseHktKey = typeof promiseNominal;

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

declare module "./hkt" {
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
    pure: Promise.resolve,
    map,
    flatMap: flatMap,
    apply,
};
