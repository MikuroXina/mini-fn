import { Option, none, some } from "./option.js";
import { Ordering, equal, greater, less } from "./ordering.js";
import {
    type AbelianGroup,
    AbelianGroupExceptZero,
    abelSymbol,
} from "./type-class/abelian-group.js";
import type { Field } from "./type-class/field.js";
import { includeZeroSymbol } from "./type-class/group.js";
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
    [includeZeroSymbol]: true,
};

export const mulAbelianGroup: AbelianGroupExceptZero<number> = {
    combine: (l, r) => l * r,
    identity: 1,
    invert: (g) => 1 / g,
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
