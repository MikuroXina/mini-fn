import { Eq, PartialEq, eqSymbol } from "./type-class/eq.js";

import type { Applicative1 } from "./type-class/applicative.js";
import type { Functor1 } from "./type-class/functor.js";
import type { GetHktA1 } from "./hkt.js";
import type { Monad1 } from "./type-class/monad.js";
import type { Traversable1 } from "./type-class/traversable.js";

const lazyNominal = Symbol("Lazy");
export type LazyHktKey = typeof lazyNominal;
export interface Lazy<L> {
    readonly [lazyNominal]: () => L;
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

export const pure = <A>(a: A): Lazy<A> => defer(() => a);
export const map =
    <A, B>(fn: (a: A) => B) =>
    (lazy: Lazy<A>): Lazy<B> =>
        defer(() => fn(force(lazy)));
export const flatMap =
    <A, B>(fn: (a: A) => Lazy<B>) =>
    (lazy: Lazy<A>): Lazy<B> =>
        defer(() => force(fn(force(lazy))));
export const apply =
    <T1, U1>(fn: Lazy<(t: T1) => U1>) =>
    (t: Lazy<T1>): Lazy<U1> =>
        defer(() => force(fn)(force(t)));
export const product =
    <A, B>(fa: Lazy<A>) =>
    (fb: Lazy<B>): Lazy<[A, B]> =>
        defer(() => [force(fa), force(fb)]);

export const foldR =
    <A, B>(folder: (a: A) => (b: B) => B) =>
    (init: B) =>
    (data: Lazy<A>): B =>
        folder(force(data))(init);
export const traverse =
    <F>(app: Applicative1<F>) =>
    <A, B>(visitor: (a: A) => GetHktA1<F, B>) =>
    (data: Lazy<A>): GetHktA1<F, Lazy<B>> =>
        app.map(pure)(visitor(force(data)));

declare module "./hkt.js" {
    export interface HktDictA1<A1> {
        [lazyNominal]: Lazy<A1>;
    }
}

export const functor: Functor1<LazyHktKey> = {
    map,
};

export const monad: Monad1<LazyHktKey> = {
    product,
    pure,
    map,
    flatMap,
    apply,
};

export const traversable: Traversable1<LazyHktKey> = {
    map,
    foldR,
    traverse,
};
