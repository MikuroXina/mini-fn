import type { Monoid } from "./type-class/monoid";

export const less = -1;
export const equal = 0;
export const greater = 1;
export type Ordering = typeof less | typeof equal | typeof greater;

export const isLt = (ord: Ordering) => ord === less;
export const isGt = (ord: Ordering) => ord === greater;
export const isLe = (ord: Ordering) => ord !== greater;
export const isGe = (ord: Ordering) => ord !== less;
export const isEq = (ord: Ordering) => ord == equal;
export const isNe = (ord: Ordering) => ord != equal;

export const reverse = (order: Ordering): Ordering => -order as Ordering;

export const then = (first: Ordering, second: Ordering) => (first === equal ? second : first);
export const thenWith = (first: Ordering, secondFn: () => Ordering) =>
    first === equal ? secondFn() : first;

export const monoid: Monoid<Ordering> = {
    combine: then,
    identity: equal,
};
