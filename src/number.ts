import { assertEquals } from "../deps.ts";
import { none, type Option, some } from "./option.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import {
    type AbelianGroup,
    type AbelianGroupExceptZero,
    abelSymbol,
} from "./type-class/abelian-group.ts";
import type { Field } from "./type-class/field.ts";
import { fromPartialCmp } from "./type-class/partial-ord.ts";
import type { Ring } from "./type-class/ring.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

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

Deno.test("partialCmp", () => {
    assertEquals(partialCmp(1, NaN), none());
    assertEquals(partialCmp(NaN, 2), none());
    assertEquals(partialCmp(NaN, NaN), none());
    assertEquals(partialCmp(1, 1), some(equal as Ordering));
    assertEquals(partialCmp(2, 2), some(equal as Ordering));
    assertEquals(partialCmp(1, 2), some(less as Ordering));
    assertEquals(partialCmp(2, 1), some(greater as Ordering));
});

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
