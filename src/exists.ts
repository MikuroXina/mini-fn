/**
 * `Exists` represents an existential quantified type. It is useful to express the model that the object which decides what kind of object is held.
 *
 * @packageDocumentation
 * @module
 */

import type { Get1 } from "./hkt.js";

declare const existsNominal: unique symbol;
/**
 * `Exists<Hkt>` represents an existential quantified type. The detail of stored value is hidden and can be extracted only using `runExists`.
 */
export type Exists<F> = F & { [existsNominal]: never };

/**
 * Converts any object that requires a type parameter into a existential quantified type.
 *
 * @param item - To be converted.
 * @returns The new existential quantified type.
 */
export const newExists = <F, A>(item: Get1<F, A>): Exists<F> =>
    item as Exists<F>;

/**
 * Extracts a value of the existential quantified type `F<A>` with a runner.
 *
 * @param runner - A function to get the internal item `F<A>`, but the type `A` will be specified by an object `Exists<F>`.
 * @param exists - A value of the existential quantified type.
 * @returns The result of `runner`.
 */
export const runExists = <F, R>(
    runner: <A>(item: Get1<F, A>) => R,
): ((exists: Exists<F>) => R) => runner as (exists: Exists<F>) => R;
