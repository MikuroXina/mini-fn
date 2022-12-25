import { Eq, eqSymbol } from "./eq.js";
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

export const fromCmp = <Lhs, Rhs>(cmp: (lhs: Lhs, rhs: Rhs) => Ordering): Ord<Lhs, Rhs> => ({
    eq: (l, r) => isEq(cmp(l, r)),
    partialCmp: (l, r) => some(cmp(l, r)),
    cmp,
    [eqSymbol]: true,
});

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => -ord.cmp(lhs, rhs) as Ordering,
    partialCmp(lhs, rhs) {
        return some(-ord.cmp(lhs, rhs) as Ordering);
    },
});
