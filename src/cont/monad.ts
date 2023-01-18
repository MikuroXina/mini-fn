import type { Get1, Hkt1 } from "../hkt.js";

import type { Monad } from "../type-class/monad.js";

export type CallCC<M> = <A, B>(
    continuation: (callback: (a: A) => Get1<M, B>) => Get1<M, A>,
) => Get1<M, A>;

export interface MonadCont<M extends Hkt1> extends Monad<M> {
    readonly callCC: CallCC<M>;
}

export const label =
    <M extends Hkt1>(mc: MonadCont<M>) =>
    <A, B>(a: A): Get1<M, [(a: A) => Get1<M, B>, A]> =>
        mc.callCC(
            (
                k: (a: [(a: A) => Get1<M, B>, A]) => Get1<M, B>,
            ): Get1<M, [(a: A) => Get1<M, B>, A]> => {
                const go = (b: A) => k([go, b]);
                return mc.pure<[(a: A) => Get1<M, B>, A]>([go, a]);
            },
        );

export const labelWithoutArg = <M extends Hkt1, A>(mc: MonadCont<M>): Get1<M, Get1<M, A>> =>
    mc.callCC((k: (a: Get1<M, A>) => Get1<M, A>): Get1<M, Get1<M, A>> => {
        const go = (): Get1<M, A> => k(go());
        return mc.pure(go());
    });
