import type { Get1, Hkt1 } from "../hkt.ts";
import { type Option, some } from "../option.ts";
import { isEq, type Ordering } from "../ordering.ts";
import type { HasNegInf } from "./has-neg-inf.ts";
import { type Eq, eqSymbol, stringEq } from "./eq.ts";
import type { HasInf } from "./has-inf.ts";
import type { PartialOrd } from "./partial-ord.ts";
import type { Contravariant } from "./variance.ts";

/**
 * All instances of `Ord` must satisfy following conditions:
 * - Transitivity: If `f` is `Ord`, for all `a`, `b` and `c`; `f(a, b) == f(b, c) == f(a, c)`.
 * - Duality: If `f` is `Ord`, for all `a` and `b`; `f(a, b) == -f(b, a)`.
 * - Strict: Ordering for all values is well-defined (so the return value is not an `Option`).
 */
export type Ord<Lhs, Rhs = Lhs> = PartialOrd<Lhs, Rhs> & Eq<Lhs, Rhs> & {
    readonly cmp: (lhs: Lhs, rhs: Rhs) => Ordering;
};

export const stringOrd: Ord<string> = {
    ...stringEq,
    cmp: (l, r) => l < r ? -1 : l === r ? 0 : 1,
    partialCmp: (l, r) => some(l < r ? -1 : l === r ? 0 : 1),
};

export const fromCmp =
    <Lhs, Rhs, X = void>(cmp: (x: X) => (lhs: Lhs, rhs: Rhs) => Ordering) =>
    (x: X): Ord<Lhs, Rhs> => ({
        eq: (l, r) => isEq(cmp(x)(l, r)),
        partialCmp: (l, r) => some(cmp(x)(l, r)),
        cmp: cmp(x),
        [eqSymbol]: true,
    });

export const fromProjection =
    <F>(projection: <X>(structure: Get1<F, X>) => X) =>
    <T>(order: Ord<T>): Ord<Get1<F, T>> => ({
        eq: (l, r) => order.eq(projection(l), projection(r)),
        [eqSymbol]: true,
        partialCmp: (l, r) => order.partialCmp(projection(l), projection(r)),
        cmp: (l, r) => order.cmp(projection(l), projection(r)),
    });

export const reversed = <Lhs, Rhs>(ord: Ord<Lhs, Rhs>): Ord<Lhs, Rhs> => ({
    ...ord,
    cmp: (lhs, rhs) => -ord.cmp(lhs, rhs) as Ordering,
    partialCmp(lhs, rhs): Option<Ordering> {
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

export const nonNanOrd:
    & Ord<number>
    & HasInf<number>
    & HasNegInf<number> = {
        ...fromCmp(() => (l: number, r: number) => {
            if (Number.isNaN(l) || Number.isNaN(r)) {
                throw new Error("NaN detected");
            }
            return Math.sign(l - r) as Ordering;
        })(),
        infinity: Number.POSITIVE_INFINITY,
        negativeInfinity: Number.NEGATIVE_INFINITY,
    };
