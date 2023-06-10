import type { Hkt1 } from "./hkt.js";
import { map as optionMap } from "./option.js";
import { reverse } from "./ordering.js";
import { eqSymbol } from "./type-class/eq.js";
import type { Monad } from "./type-class/monad.js";
import type { Ord } from "./type-class/ord.js";
import type { PartialOrd } from "./type-class/partial-ord.js";
import type { Traversable } from "./type-class/traversable.js";

const revSymbol = Symbol("ReverseItem");

/**
 * An utility container to reverse the order of value.
 */
export interface Reverse<T> {
    [revSymbol]: T;
}

export const partialOrd = <T>(order: PartialOrd<T>): PartialOrd<Reverse<T>> => ({
    partialCmp: (lhs, rhs) => optionMap(reverse)(order.partialCmp(lhs[revSymbol], rhs[revSymbol])),
    eq: (lhs, rhs) => order.eq(lhs[revSymbol], rhs[revSymbol]),
});
export const ord = <T>(order: Ord<T>): Ord<Reverse<T>> => ({
    ...partialOrd(order),
    cmp: (lhs, rhs) => order.cmp(lhs[revSymbol], rhs[revSymbol]),
    [eqSymbol]: true,
});

export const pure = <T>(item: T): Reverse<T> => ({ [revSymbol]: item });

export const map =
    <T, U>(fn: (t: T) => U) =>
    (r: Reverse<T>): Reverse<U> => ({
        [revSymbol]: fn(r[revSymbol]),
    });

export const flatMap =
    <T, U>(fn: (t: T) => Reverse<U>) =>
    (r: Reverse<T>): Reverse<U> =>
        fn(r[revSymbol]);

export const apply =
    <T, U>(fn: Reverse<(t: T) => U>) =>
    (r: Reverse<T>): Reverse<U> => ({ [revSymbol]: fn[revSymbol](r[revSymbol]) });

export interface ReverseHkt extends Hkt1 {
    readonly type: Reverse<this["arg1"]>;
}

export const monad: Monad<ReverseHkt> = {
    pure,
    map,
    flatMap,
    apply,
};

export const traversable: Traversable<ReverseHkt> = {
    map,
    foldR: (folder) => (init) => (rev) => folder(rev[revSymbol])(init),
    traverse: (app) => (visitor) => (rev) => app.map(pure)(visitor(rev[revSymbol])),
};
