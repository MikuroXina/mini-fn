import type { Get1 } from "../hkt.ts";
import type { PartialEq } from "./partial-eq.ts";

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
 * import { PartialEq } from "./partial-eq.ts";
 *
 * const numPartialEq: PartialEq<number, number> = {
 *     eq: (x, y) => x === y,
 * };
 * ```
 */
export interface Eq<Lhs, Rhs = Lhs> extends PartialEq<Lhs, Rhs> {
    readonly [eqSymbol]: true;
}

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
    <T>(equality: Eq<T>): Eq<Get1<F, T>> => ({
        eq: (l, r) => equality.eq(projection(l), projection(r)),
        [eqSymbol]: true,
    });
