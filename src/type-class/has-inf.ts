import { isLt } from "../ordering.ts";
import type { Monoid } from "./monoid.ts";
import type { Ord } from "./ord.ts";
import { semiGroupSymbol } from "./semi-group.ts";

export interface HasInf<A> extends Ord<A> {
    readonly infinity: A;
}

export const minMonoid = <A>(order: HasInf<A>): Monoid<A> => ({
    combine(l, r): A {
        return isLt(order.cmp(l, r)) ? l : r;
    },
    identity: order.infinity,
    [semiGroupSymbol]: true,
});
