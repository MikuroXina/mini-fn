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

export const strict = <T>() => fromPartialEquality<T, T>((l, r) => l === r);

export const identity = fromPartialEquality(() => true);

export const monoid = <Lhs, Rhs>(): Monoid<PartialEq<Lhs, Rhs>> => ({
    combine: (x, y) => ({ eq: (l, r) => x.eq(l, r) && y.eq(l, r) }),
    identity,
});

export const eqSymbol = Symbol("ImplEq");

/**
 * All instances of `Eq` must satisfy the following conditions:
 * - Symmetric: `Eq<A, B>` always equals to `Eq<B, A>`.
 * - Transitive: `Eq<A, B>` and `Eq<B, C>` always implies `Eq<A, C>`.
 * - Reflexive: Passing two same values to `Eq<A, A>` always returns `true`.
 *
 * For example, the comparator below cannot implement `Eq` because that does not satisfy reflexive due to `NaN === NaN` always be false.
 *
 * ```ts
 * const numPartialEq: PartialEq<number, number> = (x, y) => x === y;
 * ```
 */
export interface Eq<Lhs, Rhs = Lhs> extends PartialEq<Lhs, Rhs> {
    readonly [eqSymbol]: true;
}

export const fromEquality = <Lhs, Rhs>(equality: (l: Lhs, r: Rhs) => boolean): Eq<Lhs, Rhs> => ({
    eq: equality,
    [eqSymbol]: true,
});
