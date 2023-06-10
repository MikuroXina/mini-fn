import type { FnHkt } from "./func.js";
import type { Get2, Hkt2 } from "./hkt.js";
import type { GenericBifunctor } from "./type-class/bifunctor.js";
import type { Category } from "./type-class/category.js";
import type { Group } from "./type-class/group.js";
import type { Monoid } from "./type-class/monoid.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";
import type { Contravariant } from "./type-class/variance.js";

/**
 * Inverse of arrow from `A` to `B`.
 */
export interface Dual<A, B> {
    (b: B): A;
}

export interface DualHkt extends Hkt2 {
    readonly type: Dual<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Category` for `Dual`. The opposite category.
 */
export const cat: Category<DualHkt> = {
    identity: () => (x) => x,
    compose: (funcA) => (funcB) => (c) => funcB(funcA(c)),
};

/**
 * The instance of `Contravariant` for `Dual`.
 */
export const contra: Contravariant<DualHkt> = {
    contraMap:
        <T, U>(f: (t: T) => U) =>
        <A>(bDual: Dual<A, U>): Dual<A, T> =>
        (t) =>
            bDual(f(t)),
};

/**
 * Creates the instance of `Monoid` from `A`'s one.
 *
 * @param m - The instance of `Monoid` for `A`.
 * @returns The instance of `Monoid` for `Dual<A, B>`.
 */
export const monoid = <A, B>(m: Monoid<A>): Monoid<Dual<A, B>> => ({
    identity: () => m.identity,
    combine: (f, g) => (b) => m.combine(f(b), g(b)),
    [semiGroupSymbol]: true,
});

/**
 * Creates the instance of `Bifunctor` from `Fn`'s one.
 *
 * @param m - The instance of `Bifunctor` for `Fn`.
 * @returns The instance of `Bifunctor` for `Dual<A, B>`.
 */
export const bifunctor = <T>(
    bf: GenericBifunctor<FnHkt, FnHkt, FnHkt, T>,
): GenericBifunctor<DualHkt, DualHkt, DualHkt, T> => ({
    cat1: cat,
    cat2: cat,
    cat3: cat,
    genericBiMap:
        <A, B>(f: Dual<A, B>) =>
        <C, D>(g: Dual<C, D>): Dual<Get2<T, A, C>, Get2<T, B, D>> =>
            bf.genericBiMap(f)(g),
});

/**
 * @param group - The instance of `Group` for `A`.
 * @returns The instance of `Group` for `Dual<A, B>`.
 */
export const group = <A, B>(group: Group<A>): Group<Dual<A, B>> => ({
    combine: (l, r) => (b) => group.combine(l(b), r(b)),
    identity: () => group.identity,
    invert: (g) => (b) => group.invert(g(b)),
    [semiGroupSymbol]: true,
});
