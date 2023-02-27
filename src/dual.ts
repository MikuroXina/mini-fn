import type { FnHkt } from "./func.js";
import type { Get2, Hkt2 } from "./hkt.js";
import type { GenericBifunctor } from "./type-class/bifunctor.js";
import type { Category } from "./type-class/category.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Contravariant } from "./type-class/variance.js";

export interface Dual<A, B> {
    (b: B): A;
}

export interface DualHkt extends Hkt2 {
    readonly type: Dual<this["arg2"], this["arg1"]>;
}

export const cat: Category<DualHkt> = {
    identity: () => (x) => x,
    compose: (funcA) => (funcB) => (c) => funcB(funcA(c)),
};

export const contra: Contravariant<DualHkt> = {
    contraMap:
        <T, U>(f: (t: T) => U) =>
        <A>(bDual: Dual<A, U>): Dual<A, T> =>
        (t) =>
            bDual(f(t)),
};

export const monoid = <A, B>(m: Monoid<A>): Monoid<Dual<A, B>> => ({
    identity: () => m.identity,
    combine: (f, g) => (b) => m.combine(f(b), g(b)),
});

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