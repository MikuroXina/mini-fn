import { equal, greater, less, type Ordering } from "./ordering.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import { type SemiGroup, semiGroupSymbol } from "./type-class/semi-group.ts";

export const cmp = (lhs: string, rhs: string): Ordering => {
    if (lhs === rhs) {
        return equal;
    }
    if (lhs < rhs) {
        return less;
    }
    return greater;
};
export const ord: Ord<string> = fromCmp(() => cmp)();

/**
 * A `SemiGroup` instance of concatenating `string`s.
 */
export const semiGroup: SemiGroup<string> = {
    combine: (l, r) => l + r,
    [semiGroupSymbol]: true,
};

/**
 * A `Monoid` instance of concatenating `string`s.
 */
export const monoid: Monoid<string> = {
    ...semiGroup,
    identity: "",
};
