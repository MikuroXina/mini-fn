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
import { okOr, type Option } from "../option.js";
import { either, err, type Result } from "../result.js";

export const newPrism =
    <B, T>(upcast: (b: B) => T) =>
    <S, A>(downcast: (s: S) => Result<T, A>): Optic<S, T, A, B> =>
    (ab) =>
    (s) =>
    (tr) =>
        either(tr)((a: A) => ab(a)((b) => tr(upcast(b))))(downcast(s));

export const newPrismSimple =
    <B, S>(upcast: (b: B) => S) =>
    <A>(downcast: (s: S) => Option<A>): Optic<S, S, A, B> =>
        newPrism(upcast)((s) => okOr(s)(downcast(s)));

export const unreachable = <S, A>(): Optic<S, S, A, never> => newPrism<never, S>(absurd)<S, A>(err);
