import { Eq, eqSymbol } from "./eq.js";
import type { Get1, Hkt1 } from "../hkt.js";
import { Ordering, isEq } from "../ordering.js";

import type { PartialOrd } from "./partial-ord.js";
import { some } from "../option.js";
import type { Contravariant } from "./variance.js";

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

export const fromProjection =
    <F extends Hkt1>(projection: <X>(structure: Get1<F, X>) => X) =>
    <T>(order: Ord<T>): Ord<Get1<F, T>> => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        [eqSymbol]: true,
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
        cmp: (l, r) => order.cmp(projection(l), projection(r)),
    });

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => -ord.cmp(lhs, rhs) as Ordering,
    partialCmp(lhs, rhs) {
        return some(-ord.cmp(lhs, rhs) as Ordering);
    },
});

export interface OrdHkt extends Hkt1 {
    readonly type: Ord<this["arg1"]>;
}

export const contra: Contravariant<OrdHkt> = {
    contraMap: (f) => (ordB) => ({
        cmp: (l, r) => ordB.cmp(f(l), f(r)),
        partialCmp: (l, r) => ordB.partialCmp(f(l), f(r)),
        eq: (l, r) => ordB.eq(f(l), f(r)),
        [eqSymbol]: true,
    }),
};
