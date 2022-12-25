import { Eq, PartialEq, eqSymbol } from "./type-class/eq.js";
import {
    Lazy,
    force,
    defer as lazyDefer,
    eq as lazyEq,
    map as lazyMap,
    ord as lazyOrd,
    partialEq as lazyPartialEq,
    partialOrd as lazyPartialOrd,
} from "./lazy.js";
import type { Ord, PartialOrd } from "./type-class/ord.js";
import {
    Tuple,
    eq as tupleEq,
    map as tupleMap,
    ord as tupleOrd,
    partialEq as tuplePartialEq,
    partialOrd as tuplePartialOrd,
} from "./tuple.js";

import type { Functor1 } from "./type-class/functor.js";
import type { GetHktA1 } from "./hkt.js";
import { compose } from "./func.js";

declare const cofreeNominal: unique symbol;
export type CofreeHktKey = typeof cofreeNominal;
export type Cofree<F, A> = Lazy<Tuple<A, GetHktA1<F, Cofree<F, A>>>>;

export const partialEq = <F, A>(
    equalityA: PartialEq<A>,
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<GetHktA1<F, T>>,
): PartialEq<Cofree<F, A>> => {
    const self: PartialEq<Cofree<F, A>> = lazyPartialEq(
        tuplePartialEq(equalityA, {
            eq: (l, r) => equalityFA(self).eq(l, r),
        }),
    );
    return self;
};
export const eq = <F, A>(
    equalityA: Eq<A>,
    equalityFA: <T>(equality: Eq<T>) => Eq<GetHktA1<F, T>>,
): Eq<Cofree<F, A>> => {
    const self: Eq<Cofree<F, A>> = lazyEq(
        tupleEq(equalityA, {
            eq: (l, r) => equalityFA(self).eq(l, r),
            [eqSymbol]: true,
        }),
    );
    return self;
};
export const partialOrd = <F, A>(
    orderA: PartialOrd<A>,
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<GetHktA1<F, T>>,
): PartialOrd<Cofree<F, A>> => {
    const self: PartialOrd<Cofree<F, A>> = lazyPartialOrd(
        tuplePartialOrd(orderA, {
            eq: (l, r) => orderFA(self).eq(l, r),
            partialCmp: (l, r) => orderFA(self).partialCmp(l, r),
        }),
    );
    return self;
};
export const ord = <F, A>(
    orderA: Ord<A>,
    orderFA: <T>(order: Ord<T>) => Ord<GetHktA1<F, T>>,
): Ord<Cofree<F, A>> => {
    const self: Ord<Cofree<F, A>> = lazyOrd(
        tupleOrd(orderA, {
            eq: (l, r) => orderFA(self).eq(l, r),
            [eqSymbol]: true,
            partialCmp: (l, r) => orderFA(self).partialCmp(l, r),
            cmp: (l, r) => orderFA(self).cmp(l, r),
        }),
    );
    return self;
};

export const defer: <F, A>(fn: () => [A, GetHktA1<F, Cofree<F, A>>]) => Cofree<F, A> = lazyDefer;

export const make =
    <A>(a: A) =>
    <F>(f: GetHktA1<F, Cofree<F, A>>): Cofree<F, A> =>
        lazyDefer(() => [a, f]);

export const head = <F, A>(c: Cofree<F, A>): A => force(c)[0];

export const tail = <F, A>(c: Cofree<F, A>): GetHktA1<F, Cofree<F, A>> => force(c)[1];

export const map =
    <F>(f: Functor1<F>) =>
    <A, B>(fn: (a: A) => B) =>
    (c: Cofree<F, A>): Cofree<F, B> =>
        lazyMap(
            ([a, fa]: readonly [A, GetHktA1<F, Cofree<F, A>>]): [B, GetHktA1<F, Cofree<F, B>>] => [
                fn(a),
                f.map(map(f)(fn))(fa),
            ],
        )(c);
export const extract = head;

export const hoist =
    <F>(f: Functor1<F>) =>
    <G>(nat: <T>(a: GetHktA1<F, T>) => GetHktA1<G, T>) =>
    <A>(c: Cofree<F, A>): Cofree<G, A> =>
        lazyMap<Tuple<A, GetHktA1<F, Cofree<F, A>>>, Tuple<A, GetHktA1<G, Cofree<G, A>>>>(
            tupleMap(
                compose<GetHktA1<F, Cofree<G, A>>, GetHktA1<G, Cofree<G, A>>>(nat)(
                    f.map(hoist(f)(nat)),
                ),
            ),
        )(c);

export const build =
    <F>(f: Functor1<F>) =>
    <S, A>(builder: (s: S) => [A, GetHktA1<F, S>]) =>
    (init: S): Cofree<F, A> =>
        lazyDefer(() => tupleMap(f.map(build(f)(builder)))(builder(init)));
export const unfold =
    <F>(f: Functor1<F>) =>
    <S, A>(fn: (s: S) => A) =>
    (unfolder: (s: S) => GetHktA1<F, S>): ((init: S) => Cofree<F, A>) =>
        build(f)((s) => [fn(s), unfolder(s)]);

// TODO: explore

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [cofreeNominal]: Cofree<A1, A2>;
    }
}
