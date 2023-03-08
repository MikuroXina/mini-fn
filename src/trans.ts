import type { Get1, Get2, Hkt1, Hkt2 } from "./hkt.js";
import type { Monad } from "./type-class/monad.js";

export interface MonadTransHkt extends Hkt2 {
    readonly arg2: Hkt1;
}

export interface MonadTrans<T extends MonadTransHkt> {
    readonly lift: <M>(monad: Monad<M>) => <A>(ma: Get1<M, A>) => Get2<T, M, A>;
}
