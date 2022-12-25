import type { PartialEq } from "./partial-eq.js";

export const eqSymbol = Symbol("ImplEq");

/**
 * All instances of `Eq` must satisfy the following conditions:
 * - Symmetric: `Eq<A, B>` always equals to `Eq<B, A>`.
 * - Transitive: `Eq<A, B>` and `Eq<B, C>` always implies `Eq<A, C>`.
 * - Reflexive: Passing two same values to `Eq<A, A>` always returns `true`.
 *
 * For example, the comparator below cannot implement `Eq` because that does not satisfy reflexive due to `NaN === NaN` always be false.
 *
 * ```ts
 * const numPartialEq: PartialEq<number, number> = (x, y) => x === y;
 * ```
 */
export interface Eq<Lhs, Rhs = Lhs> extends PartialEq<Lhs, Rhs> {
    readonly [eqSymbol]: true;
}

export const fromEquality = <Lhs, Rhs>(equality: (l: Lhs, r: Rhs) => boolean): Eq<Lhs, Rhs> => ({
    eq: equality,
    [eqSymbol]: true,
});
