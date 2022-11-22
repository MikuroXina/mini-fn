import type { GetHktA1, GetHktA2, GetHktA3, HktKeyA1, HktKeyA2, HktKeyA3 } from "../hkt";
import type { Monad1, Monad2, Monad3 } from "type-class/monad";

export interface MonadPromise1<M extends HktKeyA1> extends Monad1<M> {
    liftPromise: <T>(a: Promise<T>) => GetHktA1<M, T>;
}

export interface MonadPromise2<M extends HktKeyA2> extends Monad2<M> {
    liftPromise: <U, T>(a: Promise<T>) => GetHktA2<M, U, T>;
}

export interface MonadPromise3<M extends HktKeyA3> extends Monad3<M> {
    liftPromise: <V, U, T>(a: Promise<T>) => GetHktA3<M, V, U, T>;
}
