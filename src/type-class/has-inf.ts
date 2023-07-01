import { isLt } from "../ordering.js";
import type { Monoid } from "./monoid.js";
import type { Ord } from "./ord.js";
import { semiGroupSymbol } from "./semi-group.js";

export interface HasInf<A> extends Ord<A> {
    readonly infinity: A;
}

export const minMonoid = <A>(order: HasInf<A>): Monoid<A> => ({
    combine(l, r) {
        return isLt(order.cmp(l, r)) ? l : r;
    },
    identity: order.infinity,
    [semiGroupSymbol]: true,
});
