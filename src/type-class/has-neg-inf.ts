import { isLt } from "../ordering.ts";
import type { Monoid } from "./monoid.ts";
import type { Ord } from "./ord.ts";
import { semiGroupSymbol } from "./semi-group.ts";

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
