import { type FreeHkt, monad as monadF, wrap } from "../free.js";
import { compose } from "../func.js";
import type { Apply2Only, Get1, Get2 } from "../hkt.js";
import type { MonadTrans, MonadTransHkt } from "../trans.js";
import type { Functor } from "../type-class/functor.js";
import { flat, type Monad } from "../type-class/monad.js";

export type MonadFree<F, M> = Monad<M> & {
    readonly wrap: <A>(fma: Get1<F, Get1<M, A>>) => Get1<M, A>;
};

export const liftF =
    <F, M>(functor: Functor<F>, monadFree: MonadFree<F, M>) =>
    <A>(fa: Get1<F, A>): Get1<M, A> =>
        monadFree.wrap(functor.map(monadFree.pure)(fa));

export const wrapT = <F, M, T extends MonadTransHkt>(
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

export const functorMonadFree = <F>(): MonadFree<
    F,
    Apply2Only<FreeHkt, F>
> => ({
    ...monadF(),
    wrap,
});
