import type { Get1, Hkt1 } from "../hkt.ts";
import { flatMap, map, mapOr, type Option, some } from "../option.ts";
import { and, equal, isEq, type Ordering } from "../ordering.ts";
import type { Monoid } from "./monoid.ts";
import type { PartialEq } from "./partial-eq.ts";
import { semiGroupSymbol } from "./semi-group.ts";
import type { Contravariant } from "./variance.ts";

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 */
export type PartialOrd<Lhs, Rhs = Lhs> = PartialEq<Lhs, Rhs> & {
    readonly partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering>;
};

export const fromPartialCmp = <Lhs, Rhs, X = void>(
    partialCmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Option<Ordering>,
) =>
(x: X): PartialOrd<Lhs, Rhs> => ({
    partialCmp: partialCmp(x),
    eq: (l, r) =>
        mapOr(false)((order: Ordering) => isEq(order))(partialCmp(x)(l, r)),
});

export const fromProjection =
    <F>(projection: <X>(structure: Get1<F, X>) => X) =>
    <T>(order: PartialOrd<T>): PartialOrd<Get1<F, T>> => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
    });

export interface PartialOrdHkt extends Hkt1 {
    readonly type: PartialOrd<this["arg1"]>;
}

export const contravariant: Contravariant<PartialOrdHkt> = {
    contraMap: <T1, U1>(f: (t1: T1) => U1) => (ord: PartialOrd<U1>) =>
        fromPartialCmp(() => (l: T1, r: T1) => ord.partialCmp(f(l), f(r)))(),
};

export const identity: PartialOrd<unknown> = fromPartialCmp(() => () =>
    some(equal)
)();

export const monoid = <Lhs, Rhs>(): Monoid<PartialOrd<Lhs, Rhs>> => ({
    combine: (x, y) => ({
        partialCmp: (l, r) =>
            flatMap((first: Ordering) =>
                map((second: Ordering) => and(second)(first))(
                    y.partialCmp(l, r),
                )
            )(x.partialCmp(l, r)),
        eq: (l, r) => x.eq(l, r) && y.eq(l, r),
    }),
    identity,
    [semiGroupSymbol]: true,
});
