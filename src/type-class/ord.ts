import { Eq, PartialEq, tuple as tupleEq } from "./eq";
import { flatMap, isNone, map, mapOr, none, Option, some } from "../option";
import { Ordering, equal, then, isEq } from "../ordering";
import type { Monoid } from "./monoid";
import { Contravariant } from "./variance";

declare const partialOrdNominal: unique symbol;
export type PartialOrdHktKey = typeof partialOrdNominal;

declare module "../hkt" {
    interface HktDictA1<A1> {
        [partialOrdNominal]: PartialOrd<A1, A1>;
    }
}

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 */
export interface PartialOrd<Lhs, Rhs> extends PartialEq<Lhs, Rhs> {
    partialCmp(lhs: Lhs, rhs: Rhs): Option<Ordering>;
}

export const fromPartialCmp = <Lhs, Rhs>(
    partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering>,
): PartialOrd<Lhs, Rhs> => ({
    partialCmp,
    eq: (l, r) => mapOr(false)(partialCmp(l, r))((order: Ordering) => isEq(order)),
});

export const tuple = <T extends unknown[]>(ord: {
    readonly [K in keyof T]: PartialOrd<T[K], T[K]>;
}): PartialOrd<T, T> => ({
    partialCmp: (lhs, rhs) => {
        const len = Math.min(lhs.length, rhs.length);
        let result: Ordering = equal;
        for (let i = 0; i < len; ++i) {
            const order = ord[i].partialCmp(lhs[i], rhs[i]);
            if (isNone(order)) {
                return none();
            }
            result = then(result, order[1]);
        }
        return some(result);
    },
    eq: tupleEq(ord).eq,
});

export const contravariant: Contravariant<PartialOrdHktKey> = {
    contraMap: (f) => (ord) => fromPartialCmp((l, r) => ord.partialCmp(f(l), f(r))),
};

export const identity: PartialOrd<unknown, unknown> = fromPartialCmp(() => some(equal));

export const monoid = <Lhs, Rhs>(): Monoid<PartialOrd<Lhs, Rhs>> => ({
    combine: (x, y) => ({
        partialCmp: (l, r) =>
            flatMap(x.partialCmp(l, r))((first) =>
                map(y.partialCmp(l, r))((second) => then(first, second)),
            ),
        eq: (l, r) => x.eq(l, r) && y.eq(l, r),
    }),
    identity: identity,
});

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 * - Strict: Ordering for all values is well-defined (so the return value is not an `Option`).
 */
export interface Ord<Lhs, Rhs> extends PartialOrd<Lhs, Rhs>, Eq<Lhs, Rhs> {
    cmp(lhs: Lhs, rhs: Rhs): Ordering;
}

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => {
        return -ord.cmp(lhs, rhs) as Ordering;
    },
    partialCmp(lhs, rhs) {
        return some(-ord.cmp(lhs, rhs) as Ordering);
    },
});
