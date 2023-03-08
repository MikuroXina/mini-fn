import type { Get1, Get2 } from "../hkt.js";
import type { Applicative } from "./applicative.js";
import type { Distributive } from "./distributive.js";
import { Profunctor, rightMap } from "./profunctor.js";
import type { Traversable } from "./traversable.js";

export interface Settable<F> extends Applicative<F>, Distributive<F>, Traversable<F> {
    readonly untainted: <A>(fa: Get1<F, A>) => A;
}

export const untaintedDot =
    <F>(settable: Settable<F>) =>
    <P>(pro: Profunctor<P>) =>
    <A, B>(g: Get2<P, A, Get1<F, B>>): Get2<P, A, B> =>
        rightMap(pro)<Get1<F, B>, B>(settable.untainted)(g);

export const taintedDot =
    <F>(settable: Settable<F>) =>
    <P>(pro: Profunctor<P>) =>
    <A, B>(g: Get2<P, A, B>): Get2<P, A, Get1<F, B>> =>
        rightMap(pro)<B, Get1<F, B>>(settable.pure)(g);
