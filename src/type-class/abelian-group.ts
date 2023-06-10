import type { Group } from "./group.js";

export const abelSymbol = Symbol("ImplAbel");

/**
 * A commutative group.
 */
export interface AbelianGroup<G> extends Group<G> {
    readonly [abelSymbol]: true;
}
