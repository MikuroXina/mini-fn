import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4 } from "./hkt.js";
import type { Monad1, Monad2, Monad2Monoid, Monad3, Monad4 } from "./type-class/monad.js";

export interface MonadTrans1<T> {
    lift: <M>(monad: Monad1<M>) => <A>(ma: GetHktA1<M, A>) => GetHktA1<T, GetHktA1<M, A>>;
}
export interface MonadTrans2<T> {
    lift: <M>(monad: Monad2<M>) => <A>(ma: GetHktA1<M, A>) => GetHktA2<T, M, A>;
}
export interface MonadTrans2Monoid<T, M> {
    lift: (monad: Monad2Monoid<T, M>) => <A>(ma: GetHktA1<M, A>) => GetHktA2<T, M, A>;
}
export interface MonadTrans3<T> {
    lift: <M>(monad: Monad3<M>) => <B, A>(ma: GetHktA2<M, B, A>) => GetHktA3<T, M, B, A>;
}
export interface MonadTrans4<T> {
    lift: <M>(monad: Monad4<M>) => <C, B, A>(ma: GetHktA3<M, C, B, A>) => GetHktA4<T, M, C, B, A>;
}
