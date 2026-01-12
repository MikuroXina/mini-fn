import { compose } from "../func.js";
import type { Get1 } from "../hkt.js";
import type { Functor } from "./functor.js";

/**
 * A dual of Monad, the framework of computing neighbor states in parallel.
 *
 * All instances of the comonad `c` must satisfy the following laws:
 *
 * - Duplicate then extract: For all `x`; `c.extract(c.duplicate(x))` equals to `x`,
 * - Extract as identity of map: For all `x`; `c.map(c.extract)(c.duplicate(x))` equals to `x`,
 * - Duplicate as identity of map: For all `x`; `c.duplicate(c.duplicate(x))` equals to `c.map(c.duplicate)(c.duplicate(x))`.
 */
export type Comonad<W> = Functor<W> & {
    /**
     * Extracts the internal state of type `A`.
     *
     * @param wa - The wrapped object about type `A`.
     * @returns The value of type `A`.
     */
    readonly extract: <A>(wa: Get1<W, A>) => A;
    /**
     * Computes the surrounding states from a source object `wa`.
     *
     * @param wa - The wrapped object about type `A`.
     * @returns The surrounding states of `wa`.
     */
    readonly duplicate: <A>(wa: Get1<W, A>) => Get1<W, Get1<W, A>>;
};

export const extend =
    <W>(comonad: Comonad<W>) =>
    <A1, A2>(
        extension: (wa: Get1<W, A1>) => A2,
    ): ((wa: Get1<W, A1>) => Get1<W, A2>) =>
        compose(comonad.map(extension))(comonad.duplicate);
