import type { Hkt1 } from "./hkt.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Contravariant } from "./type-class/variance.js";

/**
 * The function from `A` to `boolean`. For any set `A`, the set of `Predicate<A>` will be isomorphic to the set of power set of `A`.
 */
export interface Predicate<A> {
    (a: A): boolean;
}

export interface PredicateHkt extends Hkt1 {
    readonly type: Predicate<this["arg1"]>;
}

/**
 * The instance of `Contravariant` for `Predicate`.
 */
export const contra: Contravariant<PredicateHkt> = {
    contraMap: (mapper) => (predB) => (a) => predB(mapper(a)),
};

/**
 * The instance of `Monoid` for `Predicate`.
 */
export const monoid = <A>(): Monoid<Predicate<A>> => ({
    identity: () => true,
    combine: (predL, predR) => (a) => predL(a) && predR(a),
});
