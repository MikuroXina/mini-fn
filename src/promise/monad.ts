import type { GetHktA1, GetHktA2, GetHktA3 } from "../hkt.js";
import type { Monad1, Monad2, Monad3 } from "../type-class/monad.js";

export interface MonadPromise1<M> extends Monad1<M> {
    readonly liftPromise: <T>(a: Promise<T>) => GetHktA1<M, T>;
}

export interface MonadPromise2<M> extends Monad2<M> {
    readonly liftPromise: <U, T>(a: Promise<T>) => GetHktA2<M, U, T>;
}

export interface MonadPromise3<M> extends Monad3<M> {
    readonly liftPromise: <V, U, T>(a: Promise<T>) => GetHktA3<M, V, U, T>;
}
