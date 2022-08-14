import type { Monad1 } from "./type-class/monad";
import type { Monoid } from "./type-class/monoid";

declare const promiseNominal: unique symbol;
export type PromiseHktKey = typeof promiseNominal;

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
    pure: Promise.resolve,
    map: (f) => (t) => t.then(f),
    flatMap: (f) => (t) => t.then(f),
    apply: (f) => (t) => t.then((value) => f.then((func) => func(value))),
};
