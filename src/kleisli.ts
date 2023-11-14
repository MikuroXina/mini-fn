import type { Apply3Only, Get1, Hkt3 } from "./hkt.ts";
import type { Category } from "./type-class/category.ts";
import type { Monad } from "./type-class/monad.ts";

/**
 * The kleisli arrow from `A` to `B` in `M`.
 */
export interface Kleisli<M, A, B> {
    readonly runKleisli: (a: A) => Get1<M, B>;
}

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
    compose: ({ runKleisli: g }) => ({ runKleisli: f }) => ({
        runKleisli: (a) => monad.flatMap(g)(f(a)),
    }),
});
