import type { AbelianMonoid } from "./abelian-monoid.ts";
import type { Monoid } from "./monoid.ts";

/**
 * A `SemiRing` instance for `T` must satisfy these laws:
 *
 * - Additive is an abelian monoid. The identity of `additive` is called `zero`.
 * - Multiplication is a monoid. The identity of `multiplication` is called `one`.
 * - On multiplication, any element `x` is left and right annihilated by `zero`:
 *   - `multiplication.combine(zero, x)` = `zero`,
 *   - `multiplication.combine(x, zero)` = `zero`.
 */
export interface SemiRing<T> {
    additive: AbelianMonoid<T>;
    multiplication: Monoid<T>;
}
