import type { Serialize } from "./serialize.ts";
import { fromEquality } from "./type-class/eq.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

/**
 * The instance of `Monoid` about logical AND operation.
 */
export const andMonoid: Monoid<boolean> = {
    identity: true,
    combine: (l, r) => l && r,
    [semiGroupSymbol]: true,
};
/**
 * The instance of `Monoid` about logical OR operation.
 */
export const orMonoid: Monoid<boolean> = {
    identity: false,
    combine: (l, r) => l || r,
    [semiGroupSymbol]: true,
};

export const equality = (lhs: boolean, rhs: boolean): boolean => lhs === rhs;
export const eq = fromEquality(() => equality)();

export const serialize: Serialize<boolean> = (v) => (ser) =>
    ser.serializeBoolean(v);
