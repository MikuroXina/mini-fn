import type { Contravariant } from "./variance";
import type { Monoid } from "./monoid";

/**
 * All instances of `PartialEq` must satisfy the following conditions:
 * - Symmetric: `PartialEq<A, B>` always equals to `PartialEq<B, A>`.
 * - Transitive: `PartialEq<A, B>` and `PartialEq<B, C>` always implies `PartialEq<A, C>`.
 */
export interface PartialEq<in Lhs, in Rhs> {
    eq(l: Lhs, r: Rhs): boolean;
}

declare const partialEqNominal: unique symbol;
export type PartialEqHktKey = typeof partialEqNominal;
declare module "../hkt" {
    interface HktDictA1<A1> {
        [partialEqNominal]: PartialEq<A1, A1>;
    }
}

export const contravariant: Contravariant<PartialEqHktKey> = {
    contraMap:
        <T1, T2>(f: (arg: T1) => T2) =>
        (p: PartialEq<T2, T2>): PartialEq<T1, T1> => ({ eq: (l, r) => p.eq(f(l), f(r)) }),
};

export const fromCmp = <Lhs, Rhs>(cmp: (l: Lhs, r: Rhs) => boolean): PartialEq<Lhs, Rhs> => ({
    eq: cmp,
});

export const structural = <S>(cmp: { readonly [K in keyof S]: PartialEq<S[K], S[K]> }): PartialEq<
    Readonly<S>,
    Readonly<S>
> =>
    fromCmp((l, r) =>
        Object.keys(cmp).every((key) => {
            if (Object.hasOwn(cmp, key)) {
                const castKey = key as keyof S;
                return cmp[castKey].eq(l[castKey], r[castKey]);
            }
            return true;
        }),
    );

export const tuple = <S extends unknown[]>(cmp: {
    readonly [K in keyof S]: PartialEq<S[K], S[K]>;
}): PartialEq<Readonly<S>, Readonly<S>> =>
    fromCmp((l, r) => {
        const len = Math.min(l.length, r.length);
        for (let i = 0; i < len; i += 1) {
            if (!cmp[i].eq(l[i], r[i])) {
                return false;
            }
        }
        return true;
    });

export const strict = <T>() => fromCmp<T, T>((l, r) => l === r);

export const identity = fromCmp(() => true);

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
export interface Eq<in Lhs, in Rhs> extends PartialEq<Lhs, Rhs> {
    [eqSymbol]: true;
}
