import type { Apply3Only, Get1, Hkt3 } from "./hkt.js";
import type { Category } from "./type-class/category.js";
import type { Monad } from "./type-class/monad.js";

/**
 * The kleisli arrow from `A` to `B` in `M`.
 */
export type Kleisli<M, A, B> = {
    readonly runKleisli: (a: A) => Get1<M, B>;
};

export interface KleisliHkt extends Hkt3 {
    readonly type: Kleisli<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Category` for `Kleisli<M, _, _>` from monad `M`.
 */
export const category = <M>(
    monad: Monad<M>,
): Category<Apply3Only<KleisliHkt, M>> => ({
    identity: <A>() => ({
        runKleisli: monad.pure<A>,
    }),
    compose:
        ({ runKleisli: g }) =>
        ({ runKleisli: f }) => ({
            runKleisli: (a) => monad.flatMap(g)(f(a)),
        }),
});
