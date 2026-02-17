import type { Generic, GenericRepHkt, Recurse0 } from "./generic.js";
import { none, type Option, some } from "./option.js";
import { equal, greater, less, type Ordering } from "./ordering.js";
import { encU64Le } from "./serial.js";
import {
    type AbelianGroup,
    type AbelianGroupExceptZero,
    abelSymbol,
} from "./type-class/abelian-group.js";
import type { Field } from "./type-class/field.js";
import { fromEncoder, type Hash } from "./type-class/hash.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import type { PartialOrd } from "./type-class/partial-ord.js";
import type { Ring } from "./type-class/ring.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

export const cmp = (lhs: bigint, rhs: bigint): Ordering => {
    if (lhs === rhs) {
        return equal;
    }
    if (lhs < rhs) {
        return less;
    }
    return greater;
};
export const ord: Ord<bigint> = fromCmp(() => cmp)();
export const partialCmp = (lhs: bigint, rhs: bigint): Option<Ordering> =>
    some(cmp(lhs, rhs));
export const partialOrd: PartialOrd<bigint> = ord;

/**
 * The `Encoder` instance for `bigint` of 64-bit width unsigned integer.
 */
export const hash: Hash<bigint> = fromEncoder(ord)(encU64Le);

export const addAbelianGroup: AbelianGroup<bigint> = {
    combine: (l, r) => l + r,
    identity: 0n,
    invert: (g) => -g,
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};

export const mulAbelianGroup: AbelianGroupExceptZero<bigint> = {
    combine: (l, r) => l * r,
    identity: 1n,
    invert: (g) => (g === 0n ? none() : some(1n / g)),
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
};

export const ring: Ring<bigint> = {
    additive: addAbelianGroup,
    multiplication: mulAbelianGroup,
};

export const field: Field<bigint> = {
    additive: addAbelianGroup,
    multiplication: mulAbelianGroup,
};

/**
 * A higher kind of `bigint`.
 */
export interface BigIntHkt extends GenericRepHkt {
    readonly type: bigint;
    readonly repType: Recurse0<bigint>;
}

/**
 * A `Generic` instance for `bigint`.
 */
export const generic: Generic<BigIntHkt> = {
    from: (data) => data,
    to: (meta) => meta,
};
