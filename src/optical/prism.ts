/**
 * @packageDocumentation
 * Transformation combinator for a data enumerator.
 * ```text
 *                     ok
 * S --[ downcast ]--|-------------> A
 *                   |
 *                   | err
 *                   V
 * T <---------------O<-[ upcast ]-- B
 * ```
 */

import { absurd } from "../func.ts";
import type { Optic } from "../optical.ts";
import { none, okOr, type Option, some } from "../option.ts";
import { either, err, type Result } from "../result.ts";

/**
 * Creates a new `Prism` optic from the two functions.
 *
 * @param upcast - The function which coerces the modified value to a partial type.
 * @param downcast - The function which tries to coerces the source value.
 * @returns The computation to focus the data.
 */
export const newPrism =
    <B, T>(upcast: (b: B) => T) =>
    <S, A>(downcast: (s: S) => Result<T, A>): Optic<S, T, A, B> =>
    (next) =>
    (received) =>
    (callback) =>
        either(callback)((a: A) => next(a)((b) => callback(upcast(b))))(
            downcast(received),
        );

/**
 * Creates a new `Prism` optic from the two functions, but `downcast` may return a `Option`.
 *
 * @param upcast - The function which coerces the modified value to a partial type.
 * @param downcast - The function which tries to coerces the source value.
 * @returns The computation to focus the data.
 */
export const newPrismSimple =
    <B, S>(upcast: (b: B) => S) =>
    <A>(downcast: (s: S) => Option<A>): Optic<S, S, A, B> =>
        newPrism(upcast)((s) => okOr(s)(downcast(s)));

/**
 * @returns The optic which matches nothing. Getting a value through this will throw an error.
 */
export const unreachable = <S, A>(): Optic<S, S, A, never> =>
    newPrism<never, S>(absurd)<S, A>(err);

/**
 * Filters the value only if equals to `target`.
 *
 * @param target - For comparison.
 * @returns The computation to filter the data.
 */
export const only = <A>(target: A): Optic<A, A, A, A> =>
    newPrismSimple<A, A>((newValue) => newValue)((
        x,
    ) => (x === target ? some(x) : none()));

/**
 * Filters the value only if satisfies `pred`.
 *
 * @param pred - Condition to filter.
 * @returns The computation to filter the data.
 */
export const filter = <A>(pred: (a: A) => boolean): Optic<A, A, A, A> =>
    newPrismSimple<A, A>((newValue) => newValue)((
        x,
    ) => (pred(x) ? some(x) : none()));
