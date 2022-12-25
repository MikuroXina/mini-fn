import type { Monoid } from "./type-class/monoid.js";

export const less = -1;
export type Less = typeof less;
export const equal = 0;
export type Equal = typeof equal;
export const greater = 1;
export type Greater = typeof greater;
export type Ordering = Less | Equal | Greater;

export const isLt = (ord: Ordering): ord is Less => ord === less;
export const isGt = (ord: Ordering): ord is Greater => ord === greater;
export const isLe = (ord: Ordering): ord is Less | Equal => ord !== greater;
export const isGe = (ord: Ordering): ord is Greater | Equal => ord !== less;
export const isEq = (ord: Ordering): ord is Equal => ord === equal;
export const isNe = (ord: Ordering): ord is Less | Greater => ord !== equal;

export type Reversed<O extends Ordering> = O extends Less
    ? Greater
    : O extends Greater
    ? Less
    : O extends Equal
    ? Equal
    : Ordering;
export const reverse = <O extends Ordering>(order: O): Reversed<O> => -order as Reversed<O>;

export const and = (second: Ordering) => (first: Ordering) => first === equal ? second : first;
export const andThen = (secondFn: () => Ordering) => (first: Ordering) =>
    first === equal ? secondFn() : first;

export const monoid: Monoid<Ordering> = {
    combine: (l, r) => and(r)(l),
    identity: equal,
};
