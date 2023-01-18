import { Eq, fromEquality } from "./type-class/eq.js";
import type { Get1, Hkt1, Hkt2 } from "./hkt.js";
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
import { Ord, fromCmp } from "./type-class/ord.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";
import {
    Tuple,
    eq as tupleEq,
    map as tupleMap,
    ord as tupleOrd,
    partialEq as tuplePartialEq,
    partialOrd as tuplePartialOrd,
} from "./tuple.js";

import type { Functor } from "./type-class/functor.js";
import type { Option } from "./option.js";
import type { Ordering } from "./ordering.js";
import { compose } from "./func.js";

export interface CofreeHkt extends Hkt2 {
    readonly instance: Cofree<this["arg2"], this["arg1"]>;
}

export type Cofree<F, A> = Lazy<Tuple<A, Get1<F, Cofree<F, A>>>>;

export const partialEquality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: PartialEq<A>;
    equalityFA: <T>(equality: PartialEq<T>) => PartialEq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => boolean = lazyPartialEq<
        Tuple<A, Get1<F, Cofree<F, A>>>
    >(tuplePartialEq({ equalityA, equalityB: equalityFA(fromPartialEquality(() => self)()) })).eq;
    return self;
};
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <F, A>({
    equalityA,
    equalityFA,
}: {
    equalityA: Eq<A>;
    equalityFA: <T>(equality: Eq<T>) => Eq<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => boolean) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => boolean = lazyEq<
        Tuple<A, Get1<F, Cofree<F, A>>>
    >(tupleEq({ equalityA, equalityB: equalityFA(fromEquality(() => self)()) })).eq;
    return self;
};
export const eq = fromEquality(equality);
export const partialCmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: PartialOrd<A>;
    orderFA: <T>(order: PartialOrd<T>) => PartialOrd<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Option<Ordering>) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => Option<Ordering> = lazyPartialOrd(
        tuplePartialOrd({
            ordA: orderA,
            ordB: orderFA(fromPartialCmp(() => self)()),
        }),
    ).partialCmp;
    return self;
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <F, A>({
    orderA,
    orderFA,
}: {
    orderA: Ord<A>;
    orderFA: <T>(order: Ord<T>) => Ord<Get1<F, T>>;
}): ((l: Cofree<F, A>, r: Cofree<F, A>) => Ordering) => {
    const self: (l: Cofree<F, A>, r: Cofree<F, A>) => Ordering = lazyOrd(
        tupleOrd({
            ordA: orderA,
            ordB: orderFA(fromCmp(() => self)()),
        }),
    ).cmp;
    return self;
};
export const ord = fromCmp(cmp);

export const defer: <F, A>(fn: () => [A, Get1<F, Cofree<F, A>>]) => Cofree<F, A> = lazyDefer;

export const make =
    <A>(a: A) =>
    <F>(f: Get1<F, Cofree<F, A>>): Cofree<F, A> =>
        lazyDefer(() => [a, f]);

export const head = <F, A>(c: Cofree<F, A>): A => force(c)[0];

export const tail = <F, A>(c: Cofree<F, A>): Get1<F, Cofree<F, A>> => force(c)[1];

export const map =
    <F extends Hkt1>(f: Functor<F>) =>
    <A, B>(fn: (a: A) => B) =>
    (c: Cofree<F, A>): Cofree<F, B> =>
        lazyMap(([a, fa]: readonly [A, Get1<F, Cofree<F, A>>]): [B, Get1<F, Cofree<F, B>>] => [
            fn(a),
            f.map(map(f)(fn))(fa),
        ])(c);
export const extract = head;

export const hoist =
    <F extends Hkt1>(f: Functor<F>) =>
    <G>(nat: <T>(a: Get1<F, T>) => Get1<G, T>) =>
    <A>(c: Cofree<F, A>): Cofree<G, A> =>
        lazyMap<Tuple<A, Get1<F, Cofree<F, A>>>, Tuple<A, Get1<G, Cofree<G, A>>>>(
            tupleMap(
                compose<Get1<F, Cofree<G, A>>, Get1<G, Cofree<G, A>>>(nat)(f.map(hoist(f)(nat))),
            ),
        )(c);

export const build =
    <F extends Hkt1>(f: Functor<F>) =>
    <S, A>(builder: (s: S) => [A, Get1<F, S>]) =>
    (init: S): Cofree<F, A> =>
        lazyDefer(() => tupleMap(f.map(build(f)(builder)))(builder(init)));
export const unfold =
    <F extends Hkt1>(f: Functor<F>) =>
    <S, A>(fn: (s: S) => A) =>
    (unfolder: (s: S) => Get1<F, S>): ((init: S) => Cofree<F, A>) =>
        build(f)((s) => [fn(s), unfolder(s)]);

// TODO: explore
