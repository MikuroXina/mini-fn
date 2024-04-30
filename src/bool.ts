import {
    type Decoder,
    decU8,
    type Encoder,
    encU8,
    mapDecoder,
} from "./serial.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
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
export const eq: Eq<boolean> = fromEquality(() => equality)();

export const enc = (): Encoder<boolean> => (value) => encU8(value ? 1 : 0);
export const dec = (): Decoder<boolean> => mapDecoder((v) => v !== 0)(decU8());
