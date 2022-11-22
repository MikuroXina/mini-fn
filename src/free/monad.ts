import type { GetHktA1 } from "hkt";
import type { Monad1 } from "type-class/monad";

export interface MonadFree<F, M> extends Monad1<M> {
    wrap: <A>(fma: GetHktA1<F, GetHktA1<M, A>>) => GetHktA1<M, A>;
}
