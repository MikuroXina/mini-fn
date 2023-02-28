import type { Get1, Hkt1 } from "../hkt.js";
import { Option, flatMap, map, mapOr, some } from "../option.js";
import { Ordering, and, equal, isEq } from "../ordering.js";
import type { Monoid } from "./monoid.js";
import type { PartialEq } from "./partial-eq.js";
import type { Contravariant } from "./variance.js";

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 */
export interface PartialOrd<Lhs, Rhs = Lhs> extends PartialEq<Lhs, Rhs> {
    readonly partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering>;
}

export const fromPartialCmp =
    <Lhs, Rhs, X = void>(partialCmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Option<Ordering>) =>
    (x: X): PartialOrd<Lhs, Rhs> => ({
        partialCmp: partialCmp(x),
        eq: (l, r) => mapOr(false)((order: Ordering) => isEq(order))(partialCmp(x)(l, r)),
    });

export const fromProjection =
    <F extends Hkt1>(projection: <X>(structure: Get1<F, X>) => X) =>
    <T>(order: PartialOrd<T>): PartialOrd<Get1<F, T>> => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
    });

export interface PartialOrdHkt extends Hkt1 {
    readonly type: PartialOrd<this["arg1"]>;
}

export const contravariant: Contravariant<PartialOrdHkt> = {
    contraMap:
        <T1, U1>(f: (t1: T1) => U1) =>
        (ord: PartialOrd<U1>) =>
            fromPartialCmp(() => (l: T1, r: T1) => ord.partialCmp(f(l), f(r)))(),
};

export const identity: PartialOrd<unknown> = fromPartialCmp(() => () => some(equal))();

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
