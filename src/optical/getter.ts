/**
 * @packageDocumentation
 * @module
 * Extraction combinator for a data structure.
 * ```text
 * S --[ extract ]--> A

 * T <--------------- T
 * ```
 */

import type { Optic } from "../optical.ts";

export type Getter<S, A, T> = Optic<S, T, A, T>;

export const newGetter =
    <S, A, T>(getter: (s: S) => A): Getter<S, A, T> =>
    (next) =>
    (received) =>
    (callback) => next(getter(received))(callback);
