import type { Group, GroupExceptZero } from "./group.js";
import { semiGroupSymbol } from "./semi-group.js";

export const abelSymbol = Symbol("ImplAbel");

/**
 * A commutative group except zero.
 */
export type AbelianGroupExceptZero<G> = GroupExceptZero<G> & {
    readonly [abelSymbol]: true;
};

/**
 * A commutative group.
 */
export type AbelianGroup<G> = Group<G> & {
    readonly [abelSymbol]: true;
};

export const trivialAbelianGroup: AbelianGroup<never[]> = {
    combine: () => [],
    identity: [],
    invert: () => [],
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};
