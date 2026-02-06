import type { Get1, Hkt1 } from "../hkt.js";
import {
    flatMap,
    isSomeAnd,
    map,
    mapOr,
    type Option,
    some,
} from "../option.js";
import * as Ordering from "../ordering.js";
import type { Monoid } from "./monoid.js";
import type { PartialEq } from "./partial-eq.js";
import { semiGroupSymbol } from "./semi-group.js";
import type { Contravariant } from "./variance.js";

/**
 * All instances of `PartialOrd` must satisfy following conditions:
 * - Transitivity: If `f` is `PartialOrd`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `PartialOrd`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 */
export type PartialOrd<Lhs, Rhs = Lhs> = PartialEq<Lhs, Rhs> & {
    readonly partialCmp: (lhs: Lhs, rhs: Rhs) => Option<Ordering.Ordering>;
};

export const fromPartialCmp =
    <Lhs, Rhs, X = void>(
        partialCmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Option<Ordering.Ordering>,
    ) =>
    (x: X): PartialOrd<Lhs, Rhs> => ({
        partialCmp: partialCmp(x),
        eq: (l, r) =>
            mapOr(false)((order: Ordering.Ordering) => Ordering.isEq(order))(
                partialCmp(x)(l, r),
            ),
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
    contraMap:
        <T1, U1>(f: (t1: T1) => U1) =>
        (ord: PartialOrd<U1>) =>
            fromPartialCmp(
                () => (l: T1, r: T1) => ord.partialCmp(f(l), f(r)),
            )(),
};

export const identity: PartialOrd<unknown> = fromPartialCmp(
    () => () => some(Ordering.equal),
)();

/**
 * The `Monoid` instance for `PartialOrd`'s comparison.
 */
export const monoid = <Lhs, Rhs>(): Monoid<PartialOrd<Lhs, Rhs>> => ({
    combine: (x, y) => ({
        partialCmp: (l, r) =>
            flatMap((first: Ordering.Ordering) =>
                map((second: Ordering.Ordering) => Ordering.and(second)(first))(
                    y.partialCmp(l, r),
                ),
            )(x.partialCmp(l, r)),
        eq: (l, r) => x.eq(l, r) && y.eq(l, r),
    }),
    identity,
    [semiGroupSymbol]: true,
});

/**
 * Determines the two items are equal, that `ord.partialCmp(lhs, rhs)` is `some(equal)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is `some(equal)`.
 */
export const isEq =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        isSomeAnd(Ordering.isEq)(ord.partialCmp(lhs, rhs));
/**
 * Determines the two items are not equal, that `ord.partialCmp(lhs, rhs)` is not `some(equal)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is not `some(equal)`.
 */
export const isNe =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        !isSomeAnd(Ordering.isEq)(ord.partialCmp(lhs, rhs));
/**
 * Determines the left item is less than the right item, that `ord.partialCmp(lhs, rhs)` is `some(less)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is `some(less)`.
 */
export const isLt =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        isSomeAnd(Ordering.isLt)(ord.partialCmp(lhs, rhs));
/**
 * Determines the left item is greater than the right item, that `ord.partialCmp(lhs, rhs)` is `some(greater)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is `some(greater)`.
 */
export const isGt =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        isSomeAnd(Ordering.isGt)(ord.partialCmp(lhs, rhs));
/**
 * Determines the left item is less than or equal to the right item, that `ord.partialCmp(lhs, rhs)` is `some(less)` or `some(equal)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is `some(less)` or `some(equal).
 */
export const isLe =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        isSomeAnd(
            (order: Ordering.Ordering) =>
                Ordering.isLt(order) || Ordering.isEq(order),
        )(ord.partialCmp(lhs, rhs));
/**
 * Determines the left item is greater than or equal to the right item, that `ord.partialCmp(lhs, rhs)` is `some(greater)` or `some(equal)`.
 *
 * @param ord - The `PartialOrd` instance for `T`.
 * @param lhs - Left hand term.
 * @param rhs - Right hand term.
 * @returns Whether `ord.partialCmp(lhs, rhs)` is `some(greater)` or `some(equal).
 */
export const isGe =
    <T>(ord: PartialOrd<T>) =>
    (lhs: T, rhs: T): boolean =>
        isSomeAnd(
            (order: Ordering.Ordering) =>
                Ordering.isGt(order) || Ordering.isEq(order),
        )(ord.partialCmp(lhs, rhs));
