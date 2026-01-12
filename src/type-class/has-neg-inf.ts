import { isLt } from "../ordering.js";
import type { Monoid } from "./monoid.js";
import type { Ord } from "./ord.js";
import { semiGroupSymbol } from "./semi-group.js";

export type HasNegInf<A> = Ord<A> & {
    readonly negativeInfinity: A;
};

export const maxMonoid = <A>(order: HasNegInf<A>): Monoid<A> => ({
    combine(l, r): A {
        return isLt(order.cmp(l, r)) ? r : l;
    },
    identity: order.negativeInfinity,
    [semiGroupSymbol]: true,
});
