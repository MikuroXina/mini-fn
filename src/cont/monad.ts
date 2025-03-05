import type { Get1 } from "../hkt.ts";
import type { Monad } from "../type-class/monad.ts";

export type CallCC<M> = <A, B>(
    continuation: (callback: (a: A) => Get1<M, B>) => Get1<M, A>,
) => Get1<M, A>;

export type MonadCont<M> = Monad<M> & {
    readonly callCC: CallCC<M>;
};

export const label =
    <M>(mc: MonadCont<M>) => <A, B>(a: A): Get1<M, [(a: A) => Get1<M, B>, A]> =>
        mc.callCC(
            (
                k: (a: [(a: A) => Get1<M, B>, A]) => Get1<M, B>,
            ): Get1<M, [(a: A) => Get1<M, B>, A]> => {
                const go = (b: A) => k([go, b]);
                return mc.pure<[(a: A) => Get1<M, B>, A]>([go, a]);
            },
        );

export const labelWithoutArg = <M, A>(mc: MonadCont<M>): Get1<M, Get1<M, A>> =>
    mc.map((f: () => Get1<M, A>) => f())(
        mc.callCC(
            (
                k: (a: () => Get1<M, A>) => Get1<M, A>,
            ): Get1<M, () => Get1<M, A>> => {
                const go = (): Get1<M, A> => k(go);
                return mc.pure(go);
            },
        ),
    );
