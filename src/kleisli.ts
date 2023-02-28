import type { Apply3Only, Get1, Hkt1, Hkt3 } from "./hkt.js";
import type { Category } from "./type-class/category.js";
import type { Monad } from "./type-class/monad.js";

export interface Kleisli<M, A, B> {
    readonly runKleisli: (a: A) => Get1<M, B>;
}

export interface KleisliHkt extends Hkt3 {
    readonly type: Kleisli<this["arg3"], this["arg2"], this["arg1"]>;
}

export const category = <M extends Hkt1>(monad: Monad<M>): Category<Apply3Only<KleisliHkt, M>> => ({
    identity: <A>() => ({
        runKleisli: monad.pure<A>,
    }),
    compose:
        ({ runKleisli: g }) =>
        ({ runKleisli: f }) => ({
            runKleisli: (a) => monad.flatMap(g)(f(a)),
        }),
});
