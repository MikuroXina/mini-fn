import { isLt } from "src/ordering.js";

import type { Monoid } from "./monoid.js";
import type { Ord } from "./ord.js";
import { semiGroupSymbol } from "./semi-group.js";

export interface HasNegInf<A> extends Ord<A> {
    readonly negativeInfinity: A;
}

export const maxMonoid = <A>(order: HasNegInf<A>): Monoid<A> => ({
    combine(l, r) {
        return isLt(order.cmp(l, r)) ? r : l;
    },
    identity: order.negativeInfinity,
    [semiGroupSymbol]: true,
});
