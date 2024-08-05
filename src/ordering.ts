import { doT } from "./cat.ts";
import {
    decI8,
    type Decoder,
    encI8,
    type Encoder,
    monadForDecoder,
} from "./serial.ts";
import type { Monoid } from "./type-class/monoid.ts";
import { semiGroupSymbol } from "./type-class/semi-group.ts";

/**
 * Means that the left term is less than the right term.
 */
export const less = -1 as const;
export type Less = typeof less;
/**
 * Means that the left term equals to the right term.
 */
export const equal = 0 as const;
export type Equal = typeof equal;
/**
 * Means that the left term is greater than the right term.
 */
export const greater = 1 as const;
export type Greater = typeof greater;
/**
 * The ordering about two terms.
 */
export type Ordering = Less | Equal | Greater;

export const isLt = (ord: Ordering): ord is Less => ord === less;
export const isGt = (ord: Ordering): ord is Greater => ord === greater;
export const isLe = (ord: Ordering): ord is Less | Equal => ord !== greater;
export const isGe = (ord: Ordering): ord is Greater | Equal => ord !== less;
export const isEq = (ord: Ordering): ord is Equal => ord === equal;
export const isNe = (ord: Ordering): ord is Less | Greater => ord !== equal;

/**
 * The reversed type of `O` extends `Ordering`.
 */
export type Reversed<O extends Ordering> = O extends Less ? Greater
    : O extends Greater ? Less
    : O extends Equal ? Equal
    : Ordering;
/**
 * Reverses the order.
 *
 * @param order - The order value extends `Ordering`.
 * @returns The reversed order.
 */
export const reverse = <O extends Ordering>(order: O): Reversed<O> =>
    (0 - order) as Reversed<O>;

/**
 * Transits two `Ordering`s. Returns `second` if `first` is `equal`, otherwise returns `first`. It is useful to implement `PartialOrd` for some object type. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param second - The second order.
 * @param first - The first order.
 * @returns The transited order.
 */
export const and = (second: Ordering) =>
(
    first: Ordering,
) => (first === equal ? second : first);
/**
 * Transits two `Ordering`s. Returns `secondFn()` if `first` is `equal`, otherwise returns `first`. It is useful to implement `PartialOrd` for some object type. The order of arguments is reversed because of that it is useful for partial applying.
 *
 * @param secondFn - The function to provide a second order.
 * @param first - The first order.
 * @returns The transited order.
 */
export const andThen =
    (secondFn: () => Ordering) => (first: Ordering): Ordering =>
        first === equal ? secondFn() : first;

/**
 * The instance of `Monoid` about transitive for `Ordering`.
 */
export const monoid: Monoid<Ordering> = {
    combine: (l, r) => and(r)(l),
    identity: equal,
    [semiGroupSymbol]: true,
};

export const enc = (): Encoder<Ordering> => encI8;
export const dec = (): Decoder<Ordering> =>
    doT(monadForDecoder)
        .addM("variant", decI8())
        .finish(({ variant }): Ordering => Math.sign(variant) as Ordering);
