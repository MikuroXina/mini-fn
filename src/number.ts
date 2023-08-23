import { none, type Option, some } from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import {
    type AbelianGroup,
    type AbelianGroupExceptZero,
    abelSymbol,
} from "./type-class/abelian-group.js";
import type { Field } from "./type-class/field.js";
import { fromPartialCmp } from "./type-class/partial-ord.js";
import type { Ring } from "./type-class/ring.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

export const partialCmp = (lhs: number, rhs: number): Option<Ordering> => {
    if (Number.isNaN(lhs) || Number.isNaN(rhs)) {
        return none();
    }
    if (lhs == rhs) {
        return some(equal);
    }
    if (lhs < rhs) {
        return some(less);
    }
    return some(greater);
};
export const partialOrd = fromPartialCmp(() => partialCmp)();

export const addAbelianGroup: AbelianGroup<number> = {
    combine: (l, r) => l + r,
    identity: 0,
    invert: (g) => -g,
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};

export const mulAbelianGroup: AbelianGroupExceptZero<number> = {
    combine: (l, r) => l * r,
    identity: 1,
    invert: (g) => (g == 0 ? none() : some(1 / g)),
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};

export const ring: Ring<number> = {
    additive: addAbelianGroup,
    multiplication: mulAbelianGroup,
};

export const field: Field<number> = {
    additive: addAbelianGroup,
    multiplication: mulAbelianGroup,
};
