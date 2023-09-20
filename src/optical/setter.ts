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
import type { Optic } from "../optical.js";
import type { Functor } from "../type-class/functor.js";
import type { Monad } from "../type-class/monad.js";

export type Setter<S, T> = Optic<S, T, never, never>;

export const set =
    <S, T>(mapper: (s: S) => T): Setter<S, T> =>
    () =>
    (received) =>
    (callback) =>
        callback(mapper(received));

export const setF =
    <F>(f: Functor<F>) =>
    <S, T>(mapper: (s: S) => T): Setter<Get1<F, S>, Get1<F, T>> =>
    () =>
    (received) =>
    (callback) =>
        callback(f.map(mapper)(received));

export const setM =
    <M>(m: Monad<M>) =>
    <S, T>(mapper: (s: S) => T): Setter<Get1<M, S>, Get1<M, T>> =>
    () =>
    (received) =>
    (callback) =>
        callback(m.map(mapper)(received));
