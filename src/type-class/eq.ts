import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "src/hkt.js";

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

export function fromProjection<F>(
    projection: <X>(structure: GetHktA1<F, X>) => X,
): <T>(equality: Eq<T>) => Eq<GetHktA1<F, T>>;
export function fromProjection<F, A>(
    projection: <X>(structure: GetHktA2<F, A, X>) => X,
): <T>(equality: Eq<T>) => Eq<GetHktA2<F, A, T>>;
export function fromProjection<F, B, A>(
    projection: <X>(structure: GetHktA3<F, B, A, X>) => X,
): <T>(equality: Eq<T>) => Eq<GetHktA3<F, B, A, T>>;
export function fromProjection<F, C, B, A>(
    projection: <X>(structure: GetHktA4<F, C, B, A, X>) => X,
): <T>(equality: Eq<T>) => Eq<GetHktA4<F, C, B, A, T>>;
export function fromProjection<F extends symbol>(
    projection: <X>(structure: Hkt<F, X>) => X,
): <T>(equality: Eq<T>) => Eq<Hkt<F, T>> {
    return (equality) => ({
        eq: (l, r) => equality.eq(projection(l), projection(r)),
        [eqSymbol]: true,
    });
}
