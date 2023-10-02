/**
 * @packageDocumentation
 * Transformation terminal for a Functor.
 * ```text
 * S --|     never
 *  [ map ]
 * T <-|     never
 * ```
 */

import type { Get1 } from "../hkt.js";
import type { Functor } from "../type-class/functor.js";
import type { Monad } from "../type-class/monad.js";

/**
 * `Setter` is a `Optic` which transform `S` into `T` with function `A` to `B`.
 *
 * All instance `s` for `Setter` must satisfy these conditions:
 *
 * - Identity: if `s` is a `Setter<S, S, A, A>`, then `s(id) == id`.
 * - Holding composition: `compose(s(f))(s(g)) == s(compose(f)(g))` for all `f` and `g`.
 */
export interface Setter<S, T, A, B> {
    (over: (a: A) => B): (s: S) => T;
}

/**
 * Modifies going data as a terminal.
 *
 * @param mapper - The function to map the data going.
 * @returns The mapping optic like `over`.
 */
export const set =
    <S, T>(mapper: (s: S) => T): Setter<S, T, never, never> =>
    () =>
        mapper;

/**
 * Creates a new `Setter` from function. It is equivalent to an identity function.
 */
export const sets = <S, T, A, B>(f: (over: (a: A) => B) => (s: S) => T): Setter<S, T, A, B> => f;

/**
 * Replaces the value at entry with the value.
 *
 * @param lens - The lens focused to.
 * @param newValue - The value will be inserted.
 * @returns The transformation computation.
 */
export const replace =
    <S, T, A, B>(lens: Setter<S, T, A, B>) =>
    (newValue: B): ((s: S) => T) =>
        lens(() => newValue);

/**
 * Modifies data contained by `Functor` as a terminal.
 *
 * @param mapper - The function to map the data going.
 * @returns The mapping optic.
 */
export const setF = <F, S, T>(f: Functor<F>): Setter<Get1<F, S>, Get1<F, T>, S, T> => f.map;

/**
 * Modifies data contained by `Monad` as a terminal.
 *
 * @param mapper - The function to map the data going.
 * @returns The mapping optic.
 */
export const setM = <M, S, T>(m: Monad<M>): Setter<Get1<M, S>, Get1<M, T>, S, T> => m.map;
