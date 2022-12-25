import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "src/hkt.js";

import type { Contravariant } from "./variance.js";
import type { Monoid } from "./monoid.js";

/**
 * All instances of `PartialEq` must satisfy the following conditions:
 * - Symmetric: `PartialEq<A, B>` always equals to `PartialEq<B, A>`.
 * - Transitive: `PartialEq<A, B>` and `PartialEq<B, C>` always implies `PartialEq<A, C>`.
 */

export interface PartialEq<Lhs, Rhs = Lhs> {
    readonly eq: (l: Lhs, r: Rhs) => boolean;
}

declare const partialEqNominal: unique symbol;
export type PartialEqHktKey = typeof partialEqNominal;
declare module "../hkt.js" {
    interface HktDictA1<A1> {
        [partialEqNominal]: PartialEq<A1>;
    }
}

export const contravariant: Contravariant<PartialEqHktKey> = {
    contraMap:
        <T1, T2>(f: (arg: T1) => T2) =>
        (p: PartialEq<T2>): PartialEq<T1> => ({ eq: (l, r) => p.eq(f(l), f(r)) }),
};

export const fromPartialEquality = <Lhs, Rhs>(
    partialEquality: (l: Lhs, r: Rhs) => boolean,
): PartialEq<Lhs, Rhs> => ({
    eq: partialEquality,
});

export function fromProjection<F>(
    projection: <X>(structure: GetHktA1<F, X>) => X,
): <T>(equality: PartialEq<T>) => PartialEq<GetHktA1<F, T>>;
export function fromProjection<F, A>(
    projection: <X>(structure: GetHktA2<F, A, X>) => X,
): <T>(equality: PartialEq<T>) => PartialEq<GetHktA2<F, A, T>>;
export function fromProjection<F, B, A>(
    projection: <X>(structure: GetHktA3<F, B, A, X>) => X,
): <T>(equality: PartialEq<T>) => PartialEq<GetHktA3<F, B, A, T>>;
export function fromProjection<F, C, B, A>(
    projection: <X>(structure: GetHktA4<F, C, B, A, X>) => X,
): <T>(equality: PartialEq<T>) => PartialEq<GetHktA4<F, C, B, A, T>>;
export function fromProjection<F extends symbol>(
    projection: <X>(structure: Hkt<F, X>) => X,
): <T>(equality: PartialEq<T>) => PartialEq<Hkt<F, T>> {
    return (equality) => ({
        eq: (l, r) => equality.eq(projection(l), projection(r)),
    });
}

export const strict = <T>() => fromPartialEquality<T, T>((l, r) => l === r);

export const identity = fromPartialEquality(() => true);

export const monoid = <Lhs, Rhs>(): Monoid<PartialEq<Lhs, Rhs>> => ({
    combine: (x, y) => ({ eq: (l, r) => x.eq(l, r) && y.eq(l, r) }),
    identity,
});
