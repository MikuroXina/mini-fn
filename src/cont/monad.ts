import type { GetHktA1, HktKeyA1 } from "hkt";

import type { Monad } from "type-class";

export type CallCC<M extends HktKeyA1> = <A, B>(
    continuation: (callback: (a: A) => GetHktA1<M, B>) => GetHktA1<M, A>,
) => GetHktA1<M, A>;

export interface MonadCont<M extends HktKeyA1> extends Monad.Monad1<M> {
    callCC: CallCC<M>;
}

export const label =
    <M extends HktKeyA1>(mc: MonadCont<M>) =>
    <A, B>(a: A): GetHktA1<M, [(a: A) => GetHktA1<M, B>, A]> =>
        mc.callCC(
            (
                k: (a: [(a: A) => GetHktA1<M, B>, A]) => GetHktA1<M, B>,
            ): GetHktA1<M, [(a: A) => GetHktA1<M, B>, A]> => {
                const go = (b: A) => k([go, b]);
                return mc.pure<[(a: A) => GetHktA1<M, B>, A]>([go, a]);
            },
        );

export const labelWithoutArg = <M extends HktKeyA1, A>(
    mc: MonadCont<M>,
): GetHktA1<M, GetHktA1<M, A>> =>
    mc.callCC((k: (a: GetHktA1<M, A>) => GetHktA1<M, A>): GetHktA1<M, GetHktA1<M, A>> => {
        const go = (): GetHktA1<M, A> => k(go());
        return mc.pure(go());
    });
