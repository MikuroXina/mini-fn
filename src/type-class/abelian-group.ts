import type { Group, GroupExceptZero } from "./group.ts";
import { semiGroupSymbol } from "./semi-group.ts";

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

export const trivialAbelianGroup: AbelianGroup<never[]> = {
    combine: () => [],
    identity: [],
    invert: () => [],
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};
