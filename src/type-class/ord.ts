import { Eq, eqSymbol } from "./eq.js";
import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "src/hkt.js";
import { Ordering, isEq } from "../ordering.js";

import type { PartialOrd } from "./partial-ord.js";
import { some } from "../option.js";

/**
 * All instances of `Ord` must satisfy following conditions:
 * - Transitivity: If `f` is `Ord`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `Ord`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 * - Strict: Ordering for all values is well-defined (so the return value is not an `Option`).
 */
export interface Ord<Lhs, Rhs = Lhs> extends PartialOrd<Lhs, Rhs>, Eq<Lhs, Rhs> {
    readonly cmp: (lhs: Lhs, rhs: Rhs) => Ordering;
}

export const fromCmp =
    <Lhs, Rhs, X = void>(cmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Ordering) =>
    (x: X): Ord<Lhs, Rhs> => ({
        eq: (l, r) => isEq(cmp(x)(l, r)),
        partialCmp: (l, r) => some(cmp(x)(l, r)),
        cmp: cmp(x),
        [eqSymbol]: true,
    });

export function fromProjection<F>(
    projection: <X>(structure: GetHktA1<F, X>) => X,
): <T>(order: Ord<T>) => Ord<GetHktA1<F, T>>;
export function fromProjection<F, A>(
    projection: <X>(structure: GetHktA2<F, A, X>) => X,
): <T>(order: Ord<T>) => Ord<GetHktA2<F, A, T>>;
export function fromProjection<F, B, A>(
    projection: <X>(structure: GetHktA3<F, B, A, X>) => X,
): <T>(order: Ord<T>) => Ord<GetHktA3<F, B, A, T>>;
export function fromProjection<F, C, B, A>(
    projection: <X>(structure: GetHktA4<F, C, B, A, X>) => X,
): <T>(order: Ord<T>) => Ord<GetHktA4<F, C, B, A, T>>;
export function fromProjection<F extends symbol>(
    projection: <X>(structure: Hkt<F, X>) => X,
): <T>(order: Ord<T>) => Ord<Hkt<F, T>> {
    return (order) => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        [eqSymbol]: true,
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
        cmp: (l, r) => order.cmp(projection(l), projection(r)),
    });
}

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => -ord.cmp(lhs, rhs) as Ordering,
    partialCmp(lhs, rhs) {
        return some(-ord.cmp(lhs, rhs) as Ordering);
    },
});
