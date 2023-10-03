import type { Hkt1 } from "./hkt.js";
import { Eq, Ord, PartialEq, PartialOrd } from "./type-class.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Monoid } from "./type-class/monoid.js";
import { type SemiGroup, semiGroupSymbol } from "./type-class/semi-group.js";

export interface Swapped<A> {
    readonly swapped: A;
}

export interface SwappedHkt extends Hkt1 {
    readonly type: Swapped<this["arg1"]>;
}

export const getSwapped = <A>(s: Swapped<A>): A => s.swapped;

export const partialEq = PartialEq.fromProjection<SwappedHkt>(getSwapped);
export const eq = Eq.fromProjection<SwappedHkt>(getSwapped);
export const partialOrd = PartialOrd.fromProjection<SwappedHkt>(getSwapped);
export const ord = Ord.fromProjection<SwappedHkt>(getSwapped);

export const pure = <A>(swapped: A): Swapped<A> => ({ swapped });

export const map =
    <T, U>(fn: (t: T) => U) =>
    (t: Swapped<T>): Swapped<U> =>
        pure(fn(t.swapped));

export const apply =
    <T, U>(fn: Swapped<(t: T) => U>) =>
    (t: Swapped<T>): Swapped<U> =>
        pure(fn.swapped(t.swapped));

export const flatMap =
    <T, U>(f: (t: T) => Swapped<U>) =>
    (t: Swapped<T>): Swapped<U> =>
        f(t.swapped);

export const semiGroup = <A>(s: SemiGroup<A>): SemiGroup<Swapped<A>> => ({
    combine: (l, r) => pure(s.combine(r.swapped, l.swapped)),
    [semiGroupSymbol]: true,
});

export const monoid = <A>(m: Monoid<A>): Monoid<Swapped<A>> => ({
    ...semiGroup(m),
    identity: pure(m.identity),
});

export const functor: Functor<SwappedHkt> = { map };

export const applicative: Applicative<SwappedHkt> = {
    ...functor,
    pure,
    apply,
};

export const monad: Monad<SwappedHkt> = {
    ...applicative,
    flatMap,
};
