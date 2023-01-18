import type { Apply2Only, Get1, Get2, Hkt1 } from "../hkt.js";
import { Monad, flat } from "../type-class/monad.js";
import type { MonadTrans, MonadTransHkt } from "../trans.js";

import type { Functor } from "../type-class/functor.js";
import { compose } from "../func.js";

export interface MonadFree<F, M extends Hkt1> extends Monad<M> {
    readonly wrap: <A>(fma: Get1<F, Get1<M, A>>) => Get1<M, A>;
}

export const liftF =
    <F extends Hkt1, M extends Hkt1>(functor: Functor<F>, monadFree: MonadFree<F, M>) =>
    <A>(fa: Get1<F, A>): Get1<M, A> =>
        monadFree.wrap(functor.map(monadFree.pure)(fa));

export const wrapT = <F extends Hkt1, M extends Hkt1, T extends MonadTransHkt>(
    functor: Functor<F>,
    monadFree: MonadFree<F, M>,
    trans: MonadTrans<T>,
    monad: Monad<Apply2Only<T, M>>,
): (<A>(ftma: Get1<F, Get2<T, M, A>>) => Get2<T, M, A>) =>
    compose<Get2<T, M, Get2<T, M, unknown>>, Get2<T, M, unknown>>(flat(monad))(
        compose<Get1<M, unknown>, Get2<T, M, unknown>>(trans.lift(monadFree))(
            liftF(functor, monadFree),
        ),
    );
