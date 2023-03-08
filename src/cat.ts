/* eslint-disable no-console */

/**
 * This package provides a value transformer `Cat` and associated functions.
 *
 * @packageDocumentation
 */
import type { Hkt1 } from "./hkt.js";
import { fromProjection as eqFromProjection } from "./type-class/eq.js";
import type { Monad } from "./type-class/monad.js";
import { fromProjection as ordFromProjection } from "./type-class/ord.js";
import { fromProjection as partialEqFromProjection } from "./type-class/partial-eq.js";
import { fromProjection as partialOrdFromProjection } from "./type-class/partial-ord.js";

export interface CatHkt extends Hkt1 {
    readonly type: Cat<this["arg1"]>;
}

/**
 * Contains a `value` and can be transformed into another one by `feed`.
 *
 * @typeParam T - Type of value, contained by `Cat`.
 */
export interface Cat<T> {
    /**
     * Contained value. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly value: T;
    /**
     * Feeds a function to the `Cat`, then `Cat` creates a new `Cat` by calling it.
     *
     * @param fn - A map function for `value`, having referential-transparency is expected.
     * @returns A new `Cat` transformed from `value` by `fn`.
     */
    readonly feed: <U>(fn: (t: T) => U) => Cat<U>;
}
/**
 * Creates a new `Cat` contained `value`.
 *
 * @param value - A value will be contained.
 * @returns A new created `Cat`.
 */
export const cat = <T>(value: T): Cat<T> => ({
    value,
    feed: <U>(fn: (t: T) => U) => cat(fn(value)),
});

/**
 * Gets the contained value from `Cat`. It is convenient to apply the getter for projection to some functor.
 *
 * @param cat - Source `Cat`.
 * @returns Contained value.
 */
export const get = <T>({ value }: Cat<T>): T => value;

/**
 * Creates a `PartialEq` comparator for `Cat` from another existing one.
 */
export const partialEq = partialEqFromProjection<CatHkt>(get);
/**
 * Creates a `Eq` comparator for `Cat` from another existing one.
 */
export const eq = eqFromProjection<CatHkt>(get);
/**
 * Creates a `PartialOrd` comparator for `Cat` from another existing one.
 */
export const partialOrd = partialOrdFromProjection<CatHkt>(get);
/**
 * Creates a `Ord` comparator for `Cat` from another existing one.
 */
export const ord = ordFromProjection<CatHkt>(get);

/**
 * Inspects the passing value with an inspector. It is useful for using some side effects.
 *
 * @param inspector - An inspector to see the passing value.
 * @returns An identity function.
 */
export const inspect =
    <T>(inspector: (t: T) => void) =>
    (t: T) => {
        inspector(t);
        return t;
    };
/**
 * An inspector which applied `console.log` to `inspect`.
 */
export const log = <T>(t: T) => inspect<T>(console.log)(t);
/**
 * An inspector which applied `console.debug` to `inspect`.
 */
export const debug = <T>(t: T) => inspect<T>(console.debug)(t);
/**
 * An inspector which applied `console.info` to `inspect`.
 */
export const info = <T>(t: T) => inspect<T>(console.info)(t);
/**
 * An inspector which applied `console.warn` to `inspect`.
 */
export const warn = <T>(t: T) => inspect<T>(console.warn)(t);
/**
 * An inspector which applied `console.error` to `inspect`.
 */
export const error = <T>(t: T) => inspect<T>(console.error)(t);
/**
 * An inspector which applied `console.dir` to `inspect`.
 */
export const dir = <T>(t: T) => inspect<T>(console.dir)(t);
/**
 * An inspector which applied `console.dirxml` to `inspect`.
 */
export const dirxml = <T>(t: T) => inspect<T>(console.dirxml)(t);
/**
 * An inspector which applied `console.table` to `inspect`.
 */
export const table = <T>(t: T) => inspect<T>(console.table)(t);

/**
 * Flattens a nested `Cat`. Only it extracts the contained `value`.
 *
 * @param catCat - A nested `Cat`.
 * @returns A flattened `Cat`.
 */
export const flatten = <T>(catCat: Cat<Cat<T>>): Cat<T> => catCat.value;

/**
 * Makes tuples from two `Cat`s.
 *
 * @param a - A `Cat` to be placed at left.
 * @param b - A `Cat` to be placed at right.
 * @returns A composed `Cat`.
 */
export const product =
    <A>(a: Cat<A>) =>
    <B>(b: Cat<B>): Cat<[A, B]> =>
        cat([a.value, b.value]);
/**
 * Maps an inner value of a `Cat` into another one by applying a function. It is useful to lift a function for `Cat`.
 *
 * @param fn - A function which maps from `T` to `U`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 */
export const map =
    <T, U>(fn: (t: T) => U) =>
    (catT: Cat<T>): Cat<U> =>
        catT.feed(fn);
/**
 * Maps an inner value of `Cat` into another `Cat` by applying a function. It is useful to lift a subroutine with `Cat`.
 *
 * @param fn - A function which maps from `T` to `Cat<U>`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 */
export const flatMap =
    <T, U>(fn: (t: T) => Cat<U>) =>
    (catT: Cat<T>): Cat<U> =>
        flatten(map(fn)(catT));
/**
 * Lifts down a `Cat` which contains a mapping function. It is useful to decompose a function in `Cat`.
 *
 * @param fn - A `Cat` which contains a mapping function.
 * @returns An applied function which maps from `Cat<T>` to `Cat<U>`.
 */
export const apply =
    <T1, U1>(fn: Cat<(t: T1) => U1>) =>
    (t: Cat<T1>): Cat<U1> =>
        flatMap(t.feed)(fn);

/**
 * The monad implementation of `Cat`.
 */
export const monad: Monad<CatHkt> = {
    pure: cat,
    map,
    flatMap,
    apply,
};
