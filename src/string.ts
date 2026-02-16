import { equal, greater, less, type Ordering } from "./ordering.js";
import { encUtf8 } from "./serial.js";
import { fromEncoder, type Hash } from "./type-class/hash.js";
import type { Monoid } from "./type-class/monoid.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import { type SemiGroup, semiGroupSymbol } from "./type-class/semi-group.js";

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

/**
 * A `Hash` instance for `string`.
 */
export const hash: Hash<string> = fromEncoder(ord)(encUtf8);
