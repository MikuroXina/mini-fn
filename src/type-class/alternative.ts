import type { Get1 } from "../hkt.js";
import type { Applicative } from "./applicative.js";

/**
 * A functor with monoid-ish combine operation.
 *
 * All instances of the alternative functor `a` must satisfy the following laws:
 *
 * - Associativity: For all `f`, `g` and `h`; `a.alt(a.alt(f)(g))(h)` equals to `a.alt(f)(a.alt(g)(h))`,
 * - Distributivity: For all `f`, `g` and `x`; `a.apply(a.alt(f)(g))(x)` equals to `a.alt(a.apply(f)(x))(a.apply(g)(x))`,
 * - Left identity: For all `f`; `a.alt(a.empty())(f)` equals to `f`,
 * - Right identity: For all `f`; `a.alt(f)(a.empty())` equals to `f`,
 * - Annihilation: For all `f`; `a.apply(a.empty())(f)` equals to `a.empty()`.
 */
export interface Alternative<F> extends Applicative<F> {
    /**
     * Creates an empty erroneous computation that exits early.
     */
    readonly empty: <A>() => Get1<F, A>;
    /**
     * Picks the first successful computation.
     *
     * @param first - The first computation to attempt.
     * @param second - The second computation to attempt.
     * @returns The first successful computation.
     */
    readonly alt: <A>(first: Get1<F, A>) => (second: Get1<F, A>) => Get1<F, A>;
}

/**
 * Asserts the condition, or exits early if `cond` is `false`.
 *
 * @param alternative - The `Alternative` instance for `F`.
 * @param cond - Condition to be checked.
 * @returns The asserting operation.
 */
export const guard =
    <F>(alternative: Alternative<F>) =>
    (cond: boolean): Get1<F, never[]> =>
        cond ? alternative.pure([]) : alternative.empty();

/**
 * Picks the first successful computation from `choices`.
 *
 * @param a - The `Alternative` instance for `F`.
 * @param choices - Computations to be picked.
 * @returns The first successful computation.
 */
export const alternates =
    <F>(a: Alternative<F>) =>
    <A>(...choices: readonly Get1<F, A>[]): Get1<F, A> => {
        let ret = a.empty<A>();
        for (const choice of choices) {
            ret = a.alt(choice)(ret);
        }
        return ret;
    };
