import type { Get1, Get2, Hkt1, Hkt2 } from "src/hkt.js";
import { Profunctor, rightMap } from "./profunctor.js";

import type { Applicative } from "./applicative.js";
import type { Distributive } from "./distributive.js";
import type { Traversable } from "./traversable.js";

export interface Settable<F extends Hkt1> extends Applicative<F>, Distributive<F>, Traversable<F> {
    readonly untainted: <A>(fa: Get1<F, A>) => A;
}

export const untaintedDot =
    <F extends Hkt1>(settable: Settable<F>) =>
    <P extends Hkt2>(pro: Profunctor<P>) =>
    <A, B>(g: Get2<P, A, Get1<F, B>>): Get2<P, A, B> =>
        rightMap(pro)<Get1<F, B>, B>(settable.untainted)(g);

export const taintedDot =
    <F extends Hkt1>(settable: Settable<F>) =>
    <P extends Hkt2>(pro: Profunctor<P>) =>
    <A, B>(g: Get2<P, A, B>): Get2<P, A, Get1<F, B>> =>
        rightMap(pro)<B, Get1<F, B>>(settable.pure)(g);