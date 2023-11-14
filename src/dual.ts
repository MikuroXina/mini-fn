import type { Fn, FnHkt } from "./func.ts";
import type { Get2, Hkt2 } from "./hkt.ts";
import { type AbelianGroup, abelSymbol } from "./type-class/abelian-group.ts";
import type { GenericBifunctor } from "./type-class/bifunctor.ts";
import type { Category } from "./type-class/category.ts";
import type { Group } from "./type-class/group.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";
import type { Contravariant } from "./type-class/variance.ts";

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
        <T, U>(f: (t: T) => U) => <A>(bDual: Dual<A, U>): Dual<A, T> => (t) =>
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
 * @param g - The instance of `Group` for `A`.
 * @returns The instance of `Group` for `Dual<A, B>`.
 */
export const group = <A, B>(g: Group<A>): Group<Dual<A, B>> => ({
    combine: (l, r) => (b) => g.combine(l(b), r(b)),
    identity: () => g.identity,
    invert: (f) => (b) => g.invert(f(b)),
    [semiGroupSymbol]: true,
});

/**
 * @param g - The instance of `AbelianGroup` for `A`.
 * @returns The instance of `AbelianGroup` for `Dual<A, B>`.
 */
export const abelianGroup = <A, B>(
    g: AbelianGroup<B>,
): AbelianGroup<Fn<A, B>> => ({
    combine: (l, r) => (a) => g.combine(l(a), r(a)),
    identity: () => g.identity,
    invert: (f) => (a) => g.invert(f(a)),
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
});
