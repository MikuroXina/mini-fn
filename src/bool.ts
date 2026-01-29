import type { Generic, Sum, Unit } from "./generic.js";
import {
    type Decoder,
    decU8,
    type Encoder,
    encU8,
    mapDecoder,
} from "./serial.js";
import { type Eq, fromEquality } from "./type-class/eq.js";
import type { Monoid } from "./type-class/monoid.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

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
export const eq: Eq<boolean> = fromEquality(() => equality)();

export const enc = (): Encoder<boolean> => (value) => encU8(value ? 1 : 0);
export const dec = (): Decoder<boolean> => mapDecoder((v) => v !== 0)(decU8());

/**
 * A `Generic` instance for `boolean`.
 */
export const generic: Generic<{
    readonly type: boolean;
    readonly repType: Sum<Unit, Unit>;
}> = {
    from: (data) => ({ kind: data ? "right" : "left", value: [] }),
    to: (rep) => rep.kind === "right",
};
