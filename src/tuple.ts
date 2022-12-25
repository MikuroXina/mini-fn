import { Eq, eqSymbol } from "./type-class/eq.js";
import { Lazy, force, defer as lazyDefer } from "./lazy.js";

import type { Applicative1 } from "./type-class/applicative.js";
import type { GetHktA1 } from "./hkt.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Ord } from "./type-class/ord.js";
import type { PartialEq } from "./type-class/partial-eq.js";
import type { PartialOrd } from "./type-class/partial-ord.js";
import type { SemiGroup } from "./type-class/semi-group.js";
import { andThen } from "./option.js";
import { andThen as thenWith } from "./ordering.js";

export type Tuple<A, B> = readonly [A, B];

export const partialEq = <A, B>(
    equalityA: PartialEq<A>,
    equalityB: PartialEq<B>,
): PartialEq<Tuple<A, B>> => ({
    eq: (l, r) => equalityA.eq(l[0], r[0]) && equalityB.eq(l[1], r[1]),
});
export const eq = <A, B>(equalityA: Eq<A>, equalityB: Eq<B>): Eq<Tuple<A, B>> => ({
    ...partialEq(equalityA, equalityB),
    [eqSymbol]: true,
});
export const partialOrd = <A, B>(
    ordA: PartialOrd<A>,
    ordB: PartialOrd<B>,
): PartialOrd<Tuple<A, B>> => ({
    ...partialEq(ordA, ordB),
    partialCmp: ([a1, b1], [a2, b2]) =>
        andThen(() => ordB.partialCmp(b1, b2))(ordA.partialCmp(a1, a2)),
});
export const ord = <A, B>(ordA: Ord<A>, ordB: Ord<B>): Ord<Tuple<A, B>> => ({
    ...partialOrd(ordA, ordB),
    cmp: ([a1, b1], [a2, b2]) => thenWith(() => ordB.cmp(b1, b2))(ordA.cmp(a1, a2)),
    [eqSymbol]: true,
});

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
    <F>(app: Applicative1<F>) =>
    <A, B>(visitor: (a: A) => GetHktA1<F, B>) =>
    ([a1, a2]: [A, A]): GetHktA1<F, Tuple<B, B>> =>
        app.product<B, B>(visitor(a1))(visitor(a2));

declare const tupleHktNominal: unique symbol;
export type TupleHktKey = typeof tupleHktNominal;

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [tupleHktNominal]: Tuple<A1, A2>;
    }
}
