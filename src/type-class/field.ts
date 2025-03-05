import type { AbelianGroupExceptZero } from "./abelian-group.ts";
import type { Ring } from "./ring.ts";

/**
 * A structure which can operate addition, subtraction, multiplication and division.
 *
 * All instance of `Ring` must satisfy following conditions:
 *
 * - Associative on addition: for all `x`, `y` and `z`; `additive.combine(additive.combine(x, y), z)` equals to `additive.combine(x, additive.combine(y, z))`
 * - Identity on addition: for all `x`; `additive.combine(additive.identity, x)` equals to `x`.
 * - Inverse on addition: for all `x`; exists `y`; `additive.combine(x, y)` equals to `additive.identity`.
 * - Commutative on addition: for all `x` and `y`; `additive.combine(x, y)` equals to `additive.combine(y, x)`.
 * - Associative on multiplication: for all `x`, `y` and `z` except zero; `multiplication.combine(multiplication.combine(x, y), z)` equals to `multiplication.combine(x, multiplication.combine(y, z))`
 * - Identity on multiplication: for all `x` except zero; `multiplication.combine(multiplication.identity, x)` equals to `multiplication.combine(x, multiplication.identity)` and `x`.
 * - Inverse on multiplication: for all `x` except zero; exists `y`; `multiplication.combine(x, y)` equals to `multiplication.combine(y, x)` and `multiplication.identity`.
 * - Distributive: for all `x`, `y` and `z`; `multiplication.combine(x, additive.combine(y, z))` equals to `additive.combine(multiplication.combine(x, y), multiplication.combine(x, z))`
 */
export type Field<K> = Ring<K> & {
    multiplication: AbelianGroupExceptZero<K>;
};
