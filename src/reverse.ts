import type { Hkt1 } from "./hkt.ts";
import { map as optionMap } from "./option.ts";
import { reverse } from "./ordering.ts";
import { eqSymbol } from "./type-class/eq.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Ord } from "./type-class/ord.ts";
import type { PartialOrd } from "./type-class/partial-ord.ts";
import type { Traversable } from "./type-class/traversable.ts";

const revSymbol = Symbol("ReverseItem");

/**
 * An utility container to reverse the order of value.
 */
export type Reverse<T> = {
    [revSymbol]: T;
};

export const partialOrd = <T>(
    order: PartialOrd<T>,
): PartialOrd<Reverse<T>> => ({
    partialCmp: (lhs, rhs) =>
        optionMap(reverse)(order.partialCmp(lhs[revSymbol], rhs[revSymbol])),
    eq: (lhs, rhs) => order.eq(lhs[revSymbol], rhs[revSymbol]),
});
export const ord = <T>(order: Ord<T>): Ord<Reverse<T>> => ({
    ...partialOrd(order),
    cmp: (lhs, rhs) => order.cmp(lhs[revSymbol], rhs[revSymbol]),
    [eqSymbol]: true,
});

export const pure = <T>(item: T): Reverse<T> => ({ [revSymbol]: item });

export const map = <T, U>(fn: (t: T) => U) => (r: Reverse<T>): Reverse<U> => ({
    [revSymbol]: fn(r[revSymbol]),
});

export const flatMap =
    <T, U>(fn: (t: T) => Reverse<U>) => (r: Reverse<T>): Reverse<U> =>
        fn(r[revSymbol]);

export const apply =
    <T, U>(fn: Reverse<(t: T) => U>) => (r: Reverse<T>): Reverse<U> => ({
        [revSymbol]: fn[revSymbol](r[revSymbol]),
    });

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
    traverse: (app) => (visitor) => (rev) =>
        app.map(pure)(visitor(rev[revSymbol])),
};
