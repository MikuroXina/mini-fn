import type { Get1 } from "../hkt.ts";
import type { Monad } from "../type-class/monad.ts";

export type MonadPromise<M> = Monad<M> & {
    readonly liftPromise: <T>(a: Promise<T>) => Get1<M, T>;
};
