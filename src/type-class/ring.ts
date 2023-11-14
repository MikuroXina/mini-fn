import { type AbelianGroup, trivialAbelianGroup } from "./abelian-group.ts";
import { type Monoid, trivialMonoid } from "./monoid.ts";

/**
 * A structure which can operate addition, subtraction and multiplication.
 *
 * All instance of `Ring` must satisfy following conditions:
 *
 * - Associative on addition: for all `x`, `y` and `z`; `additive.combine(additive.combine(x, y), z)` equals to `additive.combine(x, additive.combine(y, z))`
 * - Identity on addition: for all `x`; `additive.combine(additive.identity, x)` equals to `x`.
 * - Inverse on addition: for all `x`; exists `y`; `additive.combine(x, y)` equals to `additive.identity`.
 * - Commutative on addition: for all `x` and `y`; `additive.combine(x, y)` equals to `additive.combine(y, x)`.
 * - Associative on multiplication: for all `x`, `y` and `z`; `multiplication.combine(multiplication.combine(x, y), z)` equals to `multiplication.combine(x, multiplication.combine(y, z))`
 * - Identity on multiplication: for all `x`; `multiplication.combine(multiplication.identity, x)` equals to `multiplication.combine(x, multiplication.identity)` and `x`.
 * - Distributive: for all `x`, `y` and `z`; `multiplication.combine(x, additive.combine(y, z))` equals to `additive.combine(multiplication.combine(x, y), multiplication.combine(x, z))`
 */
export interface Ring<R> {
    readonly additive: AbelianGroup<R>;
    readonly multiplication: Monoid<R>;
}

export const trivialRing: Ring<[]> = {
    additive: trivialAbelianGroup,
    multiplication: trivialMonoid,
};
