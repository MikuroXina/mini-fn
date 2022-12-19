import type { GetHktA1, GetHktA2 } from "../hkt.js";
import { Monad1, Monad2Monoid, flat } from "../type-class/monad.js";

import type { Functor1 } from "../type-class/functor.js";
import type { MonadTrans2Monoid } from "../trans.js";

export interface MonadFree<F, M> extends Monad1<M> {
    wrap: <A>(fma: GetHktA1<F, GetHktA1<M, A>>) => GetHktA1<M, A>;
}

export const liftF =
    <F, M>(functor: Functor1<F>, monadFree: MonadFree<F, M>) =>
    <A>(fa: GetHktA1<F, A>): GetHktA1<M, A> =>
        monadFree.wrap(functor.map(monadFree.pure)(fa));

export const wrapT =
    <F, M, T>(
        functor: Functor1<F>,
        monadFree: MonadFree<F, M>,
        trans: MonadTrans2Monoid<T, M>,
        monad: Monad2Monoid<T, M>,
    ) =>
    <A>(fTma: GetHktA1<F, GetHktA2<T, M, A>>): GetHktA2<T, M, A> =>
        flat(monad)(trans.lift(monad)(liftF(functor, monadFree)(fTma)));
