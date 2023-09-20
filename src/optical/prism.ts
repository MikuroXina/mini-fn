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

import { absurd } from "../func.js";
import type { Optic } from "../optical.js";
import { none, okOr, type Option, some } from "../option.js";
import { either, err, type Result } from "../result.js";

export const newPrism =
    <B, T>(upcast: (b: B) => T) =>
    <S, A>(downcast: (s: S) => Result<T, A>): Optic<S, T, A, B> =>
    (next) =>
    (received) =>
    (callback) =>
        either(callback)((a: A) => next(a)((b) => callback(upcast(b))))(downcast(received));

export const newPrismSimple =
    <B, S>(upcast: (b: B) => S) =>
    <A>(downcast: (s: S) => Option<A>): Optic<S, S, A, B> =>
        newPrism(upcast)((s) => okOr(s)(downcast(s)));

export const unreachable = <S, A>(): Optic<S, S, A, never> => newPrism<never, S>(absurd)<S, A>(err);

export const only = <A>(target: A): Optic<A, A, A, []> =>
    newPrismSimple<[], A>(([]) => target)((x) => (x === target ? some(x) : none()));

export const filter =
    <A>(init: A) =>
    (pred: (a: A) => boolean): Optic<A, A, A, []> =>
        newPrismSimple<[], A>(([]) => init)((x) => (pred(x) ? some(x) : none()));
