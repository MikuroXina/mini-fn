import type { Get1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export type MonadPromise<M> = Monad<M> & {
    readonly liftPromise: <T>(a: Promise<T>) => Get1<M, T>;
};
