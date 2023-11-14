import type { Apply2Only, Hkt2 } from "./hkt.ts";
import type { Applicative } from "./type-class/applicative.ts";
import type { Bifunctor } from "./type-class/bifunctor.ts";
import { type Eq, eqSymbol } from "./type-class/eq.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monoid } from "./type-class/monoid.ts";
import type { Ord } from "./type-class/ord.ts";
import type { PartialEq } from "./type-class/partial-eq.ts";
import type { PartialOrd } from "./type-class/partial-ord.ts";
import type { SemiGroupoid } from "./type-class/semi-groupoid.ts";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Const<A, B> {
    readonly getConst: A;
}

export const newConst = <A, B>(value: A): Const<A, B> => ({ getConst: value });

export const get = <A, B = unknown>({ getConst }: Const<A, B>): A => getConst;

export const partialEq = <A, B>(
    equality: PartialEq<A>,
): PartialEq<Const<A, B>> => ({
    eq: (l, r) => equality.eq(l.getConst, r.getConst),
});
export const eq = <A, B>(equality: Eq<A>): Eq<Const<A, B>> => ({
    eq: (l, r) => equality.eq(l.getConst, r.getConst),
    [eqSymbol]: true,
});
export const partialOrd = <A, B>(
    order: PartialOrd<A>,
): PartialOrd<Const<A, B>> => ({
    ...partialEq(order),
    partialCmp: (l, r) => order.partialCmp(l.getConst, r.getConst),
});
export const ord = <A, B>(order: Ord<A>): Ord<Const<A, B>> => ({
    ...partialOrd(order),
    cmp: (l, r) => order.cmp(l.getConst, r.getConst),
    [eqSymbol]: true,
});

export const compose =
    <B, C>(_left: Const<B, C>) => <A>(right: Const<A, B>): Const<A, C> => right;

export const biMap =
    <A, B>(first: (a: A) => B) =>
    <C, D>(_second: (c: C) => D) =>
    (curr: Const<A, C>): Const<B, D> => ({ getConst: first(curr.getConst) });

export const foldR =
    <A, B>(_folder: (next: A) => (acc: B) => B) =>
    (init: B) =>
    (_data: Const<unknown, A>): B => init;

export interface ConstHkt extends Hkt2 {
    readonly type: Const<this["arg2"], this["arg1"]>;
}

export const semiGroupoid: SemiGroupoid<ConstHkt> = {
    compose,
};

export const bifunctor: Bifunctor<ConstHkt> = {
    biMap,
};

export const foldable: Foldable<ConstHkt> = {
    foldR,
};

export const functor = <M>(): Functor<Apply2Only<ConstHkt, M>> => ({
    map: () => (t) => t,
});

export const applicative = <M>(
    monoid: Monoid<M>,
): Applicative<Apply2Only<ConstHkt, M>> => ({
    ...functor(),
    pure: () => ({ getConst: monoid.identity }),
    apply: () => (t) => t,
});
