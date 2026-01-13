/**
 * This module provides a structure that denotes tropical semi-ring.
 *
 * Additive and multiplication of `Tropical` variable x and y is defined as:
 *
 * - `add(x, y)` := `Math.min(x, y)`,
 * - `mul(x, y)` := `x + y`.
 *
 * This module exports `semiRing` which is about this mathematical structure.
 *
 * @packageDocumentation
 * @module
 */

import { none, type Option, some } from "./option.js";
import { abelSymbol } from "./type-class/abelian-group.js";
import type { AbelianMonoid } from "./type-class/abelian-monoid.js";
import type { Monoid } from "./type-class/monoid.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import type { SemiRing } from "./type-class/semi-ring.js";

declare const tropicalNominal: unique symbol;
/**
 * A tropical semi-ring data which consists of finite numbers and positive infinity.
 */
export type Tropical = number & { [tropicalNominal]: never };

/**
 * Transforms a number into a `Tropical`.
 *
 * @param num - Source integer.
 * @returns The new number of `Tropical`.
 *
 * # Throws
 *
 * It throws an error only if `num` is negative infinity or NaN.
 */
export const fromNumber = (num: number): Tropical => {
    if (Number.NEGATIVE_INFINITY < num) {
        return num as Tropical;
    }
    throw new Error("tropical num must be finite or positive infinity");
};

/**
 * Checks and transforms a number into a `Tropical`.
 *
 * @param num - Source integer.
 * @returns The new number of `Tropical`, or none if failed.
 */
export const fromNumberChecked = (num: number): Option<Tropical> => {
    if (Number.NEGATIVE_INFINITY < num) {
        return some(num as Tropical);
    }
    return none();
};

/**
 * Additive about `Math.min` on `Tropical`.
 */
export const additive: AbelianMonoid<Tropical> = {
    identity: Number.POSITIVE_INFINITY as Tropical,
    combine: (l, r) => Math.min(l, r) as Tropical,
    [abelSymbol]: true,
    [semiGroupSymbol]: true,
};

/**
 * Multiplication about `+` on `Tropical`.
 */
export const multiplication: Monoid<Tropical> = {
    identity: 0 as Tropical,
    combine: (l, r) => (l + r) as Tropical,
    [semiGroupSymbol]: true,
};

/**
 * Semi-ring about `Math.min` as additive and `+` as multiplication on `Tropical`.
 */
export const semiRing: SemiRing<Tropical> = { additive, multiplication };
