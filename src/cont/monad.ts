import type { GetHktA1 } from "../hkt.js";
import type { Monad1 } from "../type-class/monad.js";

export type CallCC<M> = <A, B>(
    continuation: (callback: (a: A) => GetHktA1<M, B>) => GetHktA1<M, A>,
) => GetHktA1<M, A>;

export interface MonadCont<M> extends Monad1<M> {
    readonly callCC: CallCC<M>;
}

export const label =
    <M>(mc: MonadCont<M>) =>
    <A, B>(a: A): GetHktA1<M, [(a: A) => GetHktA1<M, B>, A]> =>
        mc.callCC(
            (
                k: (a: [(a: A) => GetHktA1<M, B>, A]) => GetHktA1<M, B>,
            ): GetHktA1<M, [(a: A) => GetHktA1<M, B>, A]> => {
                const go = (b: A) => k([go, b]);
                return mc.pure<[(a: A) => GetHktA1<M, B>, A]>([go, a]);
            },
        );

export const labelWithoutArg = <M, A>(mc: MonadCont<M>): GetHktA1<M, GetHktA1<M, A>> =>
    mc.callCC((k: (a: GetHktA1<M, A>) => GetHktA1<M, A>): GetHktA1<M, GetHktA1<M, A>> => {
        const go = (): GetHktA1<M, A> => k(go());
        return mc.pure(go());
    });
