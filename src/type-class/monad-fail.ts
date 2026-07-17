import type { Get1 } from "src/hkt.js";
import type { Monad } from "./monad.js";
import type { MonadPlus } from "./monad-plus.js";

/**
 * A monad with failure computation having an `Error`. An instance `m` of `MonadFail` must satisfy the following laws:
 *
 * - Annihilation: For all `e` and `f`; `m.flatMap(f)(m.fail(e))` equals to `m.fail(e)`.
 */
export interface MonadFail<M> extends Monad<M> {
    readonly fail: <T>(error: Error) => Get1<M, T>;
}

/**
 * Creates a `MonadFail` instance from a `MonadPlus` instance for `M`.
 *
 * The implementation of `fail` will be equal to `monadPlus.empty` but discarding `Error` object.
 *
 * @param monadPlus - A `MonadPlus` instance for `M`.
 * @returns A `MonadFail` instance for `M`.
 */
export const fromMonadPlus = <M>(monadPlus: MonadPlus<M>): MonadFail<M> => ({
    ...monadPlus,
    fail: monadPlus.empty,
});
