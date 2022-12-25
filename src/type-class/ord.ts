import { Eq, PartialEq, tuple as tupleEq } from "./eq.js";
import { Option, flatMap, isNone, map, mapOr, none, some } from "../option.js";
import { Ordering, and, equal, greater, isEq, less } from "../ordering.js";

import type { Contravariant } from "./variance.js";
import type { Monoid } from "./monoid.js";

declare const partialOrdNominal: unique symbol;
export type PartialOrdHktKey = typeof partialOrdNominal;

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 */
export interface PartialOrd<Lhs, Rhs = Lhs> extends PartialEq<Lhs, Rhs> {
    readonly partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering>;
}

export const fromPartialCmp = <Lhs, Rhs>(
    partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering>,
): PartialOrd<Lhs, Rhs> => ({
    partialCmp,
    eq: (l, r) => mapOr(false)((order: Ordering) => isEq(order))(partialCmp(l, r)),
});

export const numeric = fromPartialCmp((l: number, r: number) => {
    if (Number.isNaN(l) || Number.isNaN(r)) {
        return none();
    }
    if (l == r) {
        return some(equal);
    }
    if (l < r) {
        return some(less);
    }
    return some(greater);
});

export const tuple = <T extends unknown[]>(ord: {
    readonly [K in keyof T]: PartialOrd<T[K]>;
}): PartialOrd<T> => ({
    partialCmp: (lhs, rhs) => {
        const len = Math.min(lhs.length, rhs.length);
        let result: Ordering = equal;
        for (let i = 0; i < len; i += 1) {
            const order = ord[i].partialCmp(lhs[i], rhs[i]);
            if (isNone(order)) {
                return none();
            }
            result = and(order[1])(result);
        }
        return some(result);
    },
    eq: tupleEq(ord).eq,
});

declare module "../hkt.js" {
    interface HktDictA1<A1> {
        [partialOrdNominal]: PartialOrd<A1>;
    }
}

export const contravariant: Contravariant<PartialOrdHktKey> = {
    contraMap: (f) => (ord) => fromPartialCmp((l, r) => ord.partialCmp(f(l), f(r))),
};

export const identity: PartialOrd<unknown> = fromPartialCmp(() => some(equal));

export const monoid = <Lhs, Rhs>(): Monoid<PartialOrd<Lhs, Rhs>> => ({
    combine: (x, y) => ({
        partialCmp: (l, r) =>
            flatMap((first: Ordering) =>
                map((second: Ordering) => and(second)(first))(y.partialCmp(l, r)),
            )(x.partialCmp(l, r)),
        eq: (l, r) => x.eq(l, r) && y.eq(l, r),
    }),
    identity,
});

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 * - Strict: Ordering for all values is well-defined (so the return value is not an `Option`).
 */
export interface Ord<Lhs, Rhs = Lhs> extends PartialOrd<Lhs, Rhs>, Eq<Lhs, Rhs> {
    readonly cmp: (lhs: Lhs, rhs: Rhs) => Ordering;
}

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => -ord.cmp(lhs, rhs) as Ordering,
    partialCmp(lhs, rhs) {
        return some(-ord.cmp(lhs, rhs) as Ordering);
    },
});
