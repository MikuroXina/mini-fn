import type { GetHktA1, GetHktA2 } from "hkt";
import type { Monad1, Monad2, Monad2Monoid } from "type-class/monad";

export interface MonadTrans1<T> {
    lift: <M>(monad: Monad1<M>) => <A>(ma: GetHktA1<M, A>) => GetHktA1<T, GetHktA1<M, A>>;
}
export interface MonadTrans2<T> {
    lift: <M>(monad: Monad2<M>) => <A>(ma: GetHktA1<M, A>) => GetHktA2<T, M, A>;
}
export interface MonadTrans2Monoid<T, M> {
    lift: (monad: Monad2Monoid<T, M>) => <A>(ma: GetHktA1<M, A>) => GetHktA2<T, M, A>;
}
