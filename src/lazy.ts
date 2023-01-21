import type { Get1, Hkt1 } from "./hkt.js";

import type { Applicative } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Traversable } from "./type-class/traversable.js";
import { fromProjection as eqFromProjection } from "./type-class/eq.js";
import { fromProjection as ordFromProjection } from "./type-class/ord.js";
import { fromProjection as partialEqFromProjection } from "./type-class/partial-eq.js";
import { fromProjection as partialOrdFromProjection } from "./type-class/partial-ord.js";

const lazyNominal = Symbol("Lazy");

export interface Lazy<L> {
    readonly [lazyNominal]: () => L;
}

export const defer = <L>(deferred: () => L): Lazy<L> => ({ [lazyNominal]: deferred });

export const force = <L>(lazy: Lazy<L>): L => lazy[lazyNominal]();

export const partialEq = partialEqFromProjection<LazyHkt>(force);
export const eq = eqFromProjection<LazyHkt>(force);
export const partialOrd = partialOrdFromProjection<LazyHkt>(force);
export const ord = ordFromProjection<LazyHkt>(force);

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
    <F extends Hkt1>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (data: Lazy<A>): Get1<F, Lazy<B>> =>
        app.map(pure)(visitor(force(data)));

export interface LazyHkt extends Hkt1 {
    readonly type: Lazy<this["arg1"]>;
}

export const functor: Functor<LazyHkt> = {
    map,
};

export const monad: Monad<LazyHkt> = {
    pure,
    map,
    flatMap,
    apply,
};

export const traversable: Traversable<LazyHkt> = {
    map,
    foldR,
    traverse,
};
