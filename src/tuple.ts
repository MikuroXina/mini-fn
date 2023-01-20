import { Eq, fromEquality } from "./type-class/eq.js";
import type { Get1, Hkt1, Hkt2 } from "./hkt.js";
import { Lazy, force, defer as lazyDefer } from "./lazy.js";
import { Option, andThen } from "./option.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { Ordering, andThen as thenWith } from "./ordering.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";

import type { Applicative } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Representable } from "./type-class/representable.js";
import type { SemiGroup } from "./type-class/semi-group.js";

export type Tuple<A, B> = readonly [A, B];

export const partialEquality =
    <A, B>({ equalityA, equalityB }: { equalityA: PartialEq<A>; equalityB: PartialEq<B> }) =>
    (l: Tuple<A, B>, r: Tuple<A, B>): boolean =>
        equalityA.eq(l[0], r[0]) && equalityB.eq(l[1], r[1]);
export const partialEq = fromPartialEquality(partialEquality);
export const equality =
    <A, B>({ equalityA, equalityB }: { equalityA: Eq<A>; equalityB: Eq<B> }) =>
    (l: Tuple<A, B>, r: Tuple<A, B>): boolean =>
        equalityA.eq(l[0], r[0]) && equalityB.eq(l[1], r[1]);
export const eq = fromEquality(equality);
export const partialCmp =
    <A, B>({ ordA, ordB }: { ordA: PartialOrd<A>; ordB: PartialOrd<B> }) =>
    ([a1, b1]: Tuple<A, B>, [a2, b2]: Tuple<A, B>): Option<Ordering> =>
        andThen(() => ordB.partialCmp(b1, b2))(ordA.partialCmp(a1, a2));
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <A, B>({ ordA, ordB }: { ordA: Ord<A>; ordB: Ord<B> }) =>
    ([a1, b1]: Tuple<A, B>, [a2, b2]: Tuple<A, B>) =>
        thenWith(() => ordB.cmp(b1, b2))(ordA.cmp(a1, a2));
export const ord = fromCmp(cmp);

export const make =
    <A>(a: A) =>
    <B>(b: B): Tuple<A, B> =>
        [a, b];

export const first = <A, B>([a]: Tuple<A, B>): A => a;
export const second = <A, B>([, b]: Tuple<A, B>): B => b;

export const curry =
    <A, B, C>(f: (tuple: Tuple<A, B>) => C) =>
    (a: A) =>
    (b: B): C =>
        f([a, b]);

export const uncurry =
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    ([a, b]: Tuple<A, B>): C =>
        f(a)(b);

export const swap = <A, B>([a, b]: Tuple<A, B>): Tuple<B, A> => [b, a];

export const map =
    <A, B>(f: (a: A) => B) =>
    <C>([c, a]: Tuple<C, A>): Tuple<C, B> =>
        [c, f(a)];
export const apply =
    <A>(sg: SemiGroup<A>) =>
    <T, U>([a1, f]: Tuple<A, (t: T) => U>) =>
    ([a2, x]: Tuple<A, T>): Tuple<A, U> =>
        [sg.combine(a1, a2), f(x)];
export const pure =
    <A>(monoid: Monoid<A>) =>
    <B>(b: B): Tuple<A, B> =>
        [monoid.identity, b];
export const bind =
    <A>(sg: SemiGroup<A>) =>
    <B>([a1, b]: Tuple<A, B>) =>
    <C>(f: (b: B) => Tuple<A, C>) => {
        const [a2, c] = f(b);
        return [sg.combine(a1, a2), c];
    };

export const extend =
    <A>(f: <B>(tuple: Tuple<A, B>) => B) =>
    <B>(tuple: Tuple<A, B>): Tuple<A, B> =>
        [tuple[0], f(tuple)];
export const extract = second;

export const defer = <A, B>(lazy: Lazy<Tuple<A, B>>): Tuple<Lazy<A>, Lazy<B>> => [
    lazyDefer(() => first(force(lazy))),
    lazyDefer(() => second(force(lazy))),
];

export const foldR: <A, B>(
    folder: (a: A) => (b: B) => B,
) => (init: B) => (data: Tuple<A, A>) => B = (folder) => (init) => (data) => {
    const folded = folder(data[1])(init);
    return folder(data[0])(folded);
};

export const traverse =
    <F extends Hkt1>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    ([a1, a2]: [A, A]): Get1<F, Tuple<B, B>> =>
        app.product<B, B>(visitor(a1))(visitor(a2));

export const mapD =
    <A, B>(f: (a: A) => B) =>
    ([a1, a2]: Tuple<A, A>): Tuple<B, B> =>
        [f(a1), f(a2)];

export interface TupleHkt extends Hkt2 {
    readonly type: Tuple<this["arg2"], this["arg1"]>;
}

export const functor: Functor<TupleHkt> = { map };

export interface TupleDHkt extends Hkt1 {
    readonly type: Tuple<this["arg1"], this["arg1"]>;
}

export const functorD: Functor<TupleDHkt> = { map: mapD };

export const representableD: Representable<TupleDHkt, number> = {
    functor: functorD,
    index: (tuple) => (index) => index == 0 ? tuple[0] : tuple[1],
    tabulate: (get) => [get(0), get(1)],
};
