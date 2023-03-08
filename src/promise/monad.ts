import type { Get1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export interface MonadPromise<M> extends Monad<M> {
    readonly liftPromise: <T>(a: Promise<T>) => Get1<M, T>;
}
