import { type Group, type GroupExceptZero, includeZeroSymbol } from "./group.js";
import { semiGroupSymbol } from "./semi-group.js";

export const abelSymbol = Symbol("ImplAbel");

/**
 * A commutative group except zero.
 */
export interface AbelianGroupExceptZero<G> extends GroupExceptZero<G> {
    readonly [abelSymbol]: true;
}

/**
 * A commutative group.
 */
export interface AbelianGroup<G> extends Group<G> {
    readonly [abelSymbol]: true;
}

export const trivialAbelianGroup: AbelianGroup<[]> = {
    combine: () => [],
    identity: [],
    invert: () => [],
    [semiGroupSymbol]: true,
    [includeZeroSymbol]: true,
    [abelSymbol]: true,
};
