import type { Category3Monoid } from "./type-class/category.js";
import type { GetHktA1 } from "./hkt.js";
import type { Monad1 } from "./type-class/monad.js";

export interface Kleisli<M, A, B> {
    readonly runKleisli: (a: A) => GetHktA1<M, B>;
}

declare const kleisliNominal: unique symbol;
export type KleisliHktKey = typeof kleisliNominal;

declare module "./hkt.js" {
    interface HktDictA3<A1, A2, A3> {
        [kleisliNominal]: Kleisli<A1, A2, A3>;
    }
}

export const category = <M>(monad: Monad1<M>): Category3Monoid<KleisliHktKey, M> => ({
    identity: <A>() => ({
        runKleisli: monad.pure<A>,
    }),
    compose:
        ({ runKleisli: f }) =>
        ({ runKleisli: g }) => ({
            runKleisli: (a) => monad.flatMap(g)(f(a)),
        }),
});
