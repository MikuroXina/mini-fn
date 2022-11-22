import type { GetHktA1 } from "hkt";
import type { Monad1 } from "type-class/monad";

export interface MonadTrans<T> {
    lift: <M>(monad: Monad1<M>) => <A>(ma: GetHktA1<M, A>) => GetHktA1<T, GetHktA1<M, A>>;
}
