import type { Get1 } from "../hkt.js";
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
 * import { PartialEq } from "./partial-eq.js";
 *
 * const numPartialEq: PartialEq<number, number> = {
 *     eq: (x, y) => x === y,
 * };
 * ```
 */
export type Eq<Lhs, Rhs = Lhs> = PartialEq<Lhs, Rhs> & {
    readonly [eqSymbol]: true;
};

export const stringEq: Eq<string> = {
    eq: (l, r) => l === r,
    [eqSymbol]: true,
};

export const fromEquality =
    <Lhs, Rhs, X = void>(equality: (x: X) => (l: Lhs, r: Rhs) => boolean) =>
    (x: X): Eq<Lhs, Rhs> => ({
        eq: equality(x),
        [eqSymbol]: true,
    });

export const fromProjection =
    <F>(projection: <X>(structure: Get1<F, X>) => X) =>
    <L, R>(equality: Eq<L, R>): Eq<Get1<F, L>, Get1<F, R>> => ({
        eq: (l, r) => equality.eq(projection(l), projection(r)),
        [eqSymbol]: true,
    });
