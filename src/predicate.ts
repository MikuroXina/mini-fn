import type { Hkt1 } from "./hkt.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Contravariant } from "./type-class/variance.js";

export interface Predicate<A> {
    (a: A): boolean;
}

export interface PredicateHkt extends Hkt1 {
    readonly type: Predicate<this["arg1"]>;
}

export const contra: Contravariant<PredicateHkt> = {
    contraMap: (mapper) => (predB) => (a) => predB(mapper(a)),
};

export const monoid = <A>(): Monoid<Predicate<A>> => ({
    identity: () => true,
    combine: (predL, predR) => (a) => predL(a) && predR(a),
});
