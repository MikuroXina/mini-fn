import type { Get1, Get2, Hkt1, Hkt2 } from "../hkt.js";

import { Functor, replace } from "./functor.js";
import type { Representable } from "./representable.js";
import { absurd, compose, constant, flip, fnArrow } from "../func.js";
import type { Profunctor } from "./profunctor.js";
import { first, second, Tuple } from "../tuple.js";
import { fanOut } from "./arrow.js";

export interface Adjunction<F extends Hkt1, U extends Hkt1, Rep> {
    readonly functor: Functor<F>;
    readonly representable: Representable<U, Rep>;
    readonly unit: <A>(a: A) => Get1<U, Get1<F, A>>;
    readonly counit: <A>(ufa: Get1<F, Get1<U, A>>) => A;
}

export const leftAdjunct =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A, B>(f: (fa: Get1<F, A>) => B): ((a: A) => Get1<U, B>) =>
        compose(adj.representable.map(f))(adj.unit<A>);

export const rightAdjunct =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A, B>(f: (a: A) => Get1<U, B>): ((fa: Get1<F, A>) => B) =>
        compose(adj.counit<B>)(adj.functor.map(f));

export const adjuncted =
    <F extends Hkt1, U extends Hkt1, Rep, P extends Hkt2, G extends Hkt1>(
        adj: Adjunction<F, U, Rep>,
        pro: Profunctor<P>,
        functor: Functor<G>,
    ) =>
    <A, B, C, D>(
        f: Get2<P, (a: A) => Get1<U, B>, Get1<G, (c: C) => Get1<U, D>>>,
    ): Get2<P, (fa: Get1<F, A>) => B, Get1<G, (fc: Get1<F, C>) => D>> =>
        pro.diMap(leftAdjunct(adj)<A, B>)(functor.map(rightAdjunct(adj)))(f);

export const tabulateAdjunction =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <B>(f: (fe: Get1<F, []>) => B): Get1<U, B> =>
        leftAdjunct(adj)(f)([]);

export const indexAdjunction =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <B>(ub: Get1<U, B>) =>
    <A>(fa: Get1<F, A>) =>
        compose(rightAdjunct(adj)<A, B>)(constant<Get1<U, B>>)(ub)(fa);

export const zapWith =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    (ua: Get1<U, A>) =>
        rightAdjunct(adj)((b: B) => adj.representable.map(flip(f)(b))(ua));

export const splitL =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A>(fa: Get1<F, A>): [A, Get1<F, []>] =>
        rightAdjunct(adj)(
            compose(flip(leftAdjunct(adj)<[], [A, Get1<F, []>]>)([]))(
                (a: A) => (f: Get1<F, []>) => [a, f],
            ),
        )(fa);

export const unsplitL = replace;

export const extractL =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A>(fa: Get1<F, A>) =>
        first(splitL(adj)(fa));

export const duplicateL =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A>(fa: Get1<F, A>): Get1<F, Get1<F, A>> =>
        replace<F>(adj.functor)<Get1<F, A>>(fa)<A>(fa);

export const zipR =
    <F extends Hkt1, U extends Hkt1, Rep>(adj: Adjunction<F, U, Rep>) =>
    <A, B>(tuple: Tuple<Get1<U, A>, Get1<U, B>>): Get1<U, Tuple<A, B>> =>
        leftAdjunct(adj)(
            fanOut(fnArrow)(rightAdjunct(adj)(first<Get1<U, A>, Get1<U, B>>))(
                rightAdjunct(adj)(second),
            ),
        )(tuple);

export const unzipR =
    <U extends Hkt1>(functor: Functor<U>) =>
    <A, B>(uab: Get1<U, Tuple<A, B>>): Tuple<Get1<U, A>, Get1<U, B>> =>
        fanOut(fnArrow)(functor.map(first<A, B>))(functor.map(second))(uab);

export const absurdL: <F, A>(none: A) => Get1<F, never> = absurd;

export const unabsurdL = <F extends Hkt1, U extends Hkt1, Rep>(
    adj: Adjunction<F, U, Rep>,
): (<A>(fa: Get1<F, A>) => never) => rightAdjunct(adj)(absurd);