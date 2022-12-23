import { Eq, PartialEq, eqSymbol } from "./type-class/eq.js";

import type { Functor1 } from "./type-class/functor.js";

const lazyNominal = Symbol("Lazy");
export type LazyHktKey = typeof lazyNominal;
export interface Lazy<L> {
    [lazyNominal]: () => L;
}

export const defer = <L>(deferred: () => L): Lazy<L> => ({ [lazyNominal]: deferred });

export const force = <L>(lazy: Lazy<L>): L => lazy[lazyNominal]();

export const partialEq = <T>(equality: PartialEq<T, T>): PartialEq<Lazy<T>, Lazy<T>> => ({
    eq: (a, b) => equality.eq(force(a), force(b)),
});
export const eq = <T>(equality: Eq<T, T>): Eq<Lazy<T>, Lazy<T>> => ({
    ...partialEq(equality),
    [eqSymbol]: true,
});

export const map =
    <A, B>(fn: (a: A) => B) =>
    (lazy: Lazy<A>): Lazy<B> =>
        defer(() => fn(force(lazy)));

declare module "./hkt.js" {
    export interface HktDictA1<A1> {
        [lazyNominal]: Lazy<A1>;
    }
}

export const functor: Functor1<LazyHktKey> = {
    map,
};
