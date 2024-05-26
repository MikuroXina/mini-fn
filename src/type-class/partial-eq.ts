import type { Get1, Hkt1 } from "../hkt.ts";
import type { Monoid } from "./monoid.ts";
import { semiGroupSymbol } from "./semi-group.ts";
import type { Contravariant } from "./variance.ts";

/**
 * All instances of `PartialEq` must satisfy the following conditions:
 * - Symmetric: `PartialEq<A, B>` always equals to `PartialEq<B, A>`.
 * - Transitive: `PartialEq<A, B>` and `PartialEq<B, C>` always implies `PartialEq<A, C>`.
 */

export interface PartialEq<Lhs, Rhs = Lhs> {
    readonly eq: (l: Lhs, r: Rhs) => boolean;
}

export interface PartialEqHkt extends Hkt1 {
    readonly type: PartialEq<this["arg1"]>;
}

export const contravariant: Contravariant<PartialEqHkt> = {
    contraMap:
        <T1, T2>(f: (arg: T1) => T2) => (p: PartialEq<T2>): PartialEq<T1> => ({
            eq: (l, r) => p.eq(f(l), f(r)),
        }),
};

export const fromPartialEquality = <Lhs, Rhs, X = void>(
    partialEquality: (x: X) => (l: Lhs, r: Rhs) => boolean,
) =>
(x: X): PartialEq<Lhs, Rhs> => ({
    eq: partialEquality(x),
});

export const fromProjection =
    <F>(projection: <X>(structure: Get1<F, X>) => X) =>
    <T>(equality: PartialEq<T>): PartialEq<Get1<F, T>> => ({
        eq: (l, r) => equality.eq(projection(l), projection(r)),
    });

export const strict = <T>(): PartialEq<T> =>
    fromPartialEquality<T, T>(() => (l, r) => l === r)();

export const identity: <Lhs, Rhs>() => PartialEq<Lhs, Rhs> =
    fromPartialEquality(() => () => true);

export const monoid = <Lhs, Rhs>(): Monoid<PartialEq<Lhs, Rhs>> => ({
    combine: (x, y) => ({ eq: (l, r) => x.eq(l, r) && y.eq(l, r) }),
    identity: identity(),
    [semiGroupSymbol]: true,
});

export interface PartialEqUnary<F> {
    readonly liftEq: <Lhs, Rhs = Lhs>(
        equality: (l: Lhs, r: Rhs) => boolean,
    ) => (l: Get1<F, Lhs>, r: Get1<F, Rhs>) => boolean;
}

/**
 * Creates the new lifter of equality from a transformer of `PartialEq`.
 *
 * @param lifter - The function transforming about `PartialEq`.
 * @returns The new `PartialEqUnary` for `F`.
 */
export const fromLifter = <F>(
    lifter: <Lhs, Rhs>(
        eq: PartialEq<Lhs, Rhs>,
    ) => PartialEq<Get1<F, Lhs>, Get1<F, Rhs>>,
): PartialEqUnary<F> => ({
    liftEq: (equality) => (l, r) => lifter({ eq: equality }).eq(l, r),
});
