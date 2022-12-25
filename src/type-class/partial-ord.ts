import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "src/hkt.js";
import { Option, flatMap, map, mapOr, some } from "../option.js";
import { Ordering, and, equal, isEq } from "../ordering.js";

import type { Contravariant } from "./variance.js";
import type { Monoid } from "./monoid.js";
import type { PartialEq } from "./partial-eq.js";

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

export const fromPartialCmp =
    <Lhs, Rhs, X = void>(partialCmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Option<Ordering>) =>
    (x: X): PartialOrd<Lhs, Rhs> => ({
        partialCmp: partialCmp(x),
        eq: (l, r) => mapOr(false)((order: Ordering) => isEq(order))(partialCmp(x)(l, r)),
    });

export function fromProjection<F>(
    projection: <X>(structure: GetHktA1<F, X>) => X,
): <T>(order: PartialOrd<T>) => PartialOrd<GetHktA1<F, T>>;
export function fromProjection<F, A>(
    projection: <X>(structure: GetHktA2<F, A, X>) => X,
): <T>(order: PartialOrd<T>) => PartialOrd<GetHktA2<F, A, T>>;
export function fromProjection<F, B, A>(
    projection: <X>(structure: GetHktA3<F, B, A, X>) => X,
): <T>(order: PartialOrd<T>) => PartialOrd<GetHktA3<F, B, A, T>>;
export function fromProjection<F, C, B, A>(
    projection: <X>(structure: GetHktA4<F, C, B, A, X>) => X,
): <T>(order: PartialOrd<T>) => PartialOrd<GetHktA4<F, C, B, A, T>>;
export function fromProjection<F extends symbol>(
    projection: <X>(structure: Hkt<F, X>) => X,
): <T>(order: PartialOrd<T>) => PartialOrd<Hkt<F, T>> {
    return (order) => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
    });
}

declare module "../hkt.js" {
    interface HktDictA1<A1> {
        [partialOrdNominal]: PartialOrd<A1>;
    }
}

export const contravariant: Contravariant<PartialOrdHktKey> = {
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
