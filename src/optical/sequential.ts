/**
 * @packageDocumentation
 * @module
 *
 * A sequential combinator that merging two computations `C1` and `C2`. It computes next computation twice.
 *
 * ```text
 *            +------+
 * S -------->|      |---------> A
 *            |  C1  |
 *     +------|      |<--------- B
 *     |      +------+
 *     | U
 *     |      +------+
 *     +----->|      |--------> A
 *            |  C2  |
 * T <--------|      |<-------- B
 *            +------+
 * ```
 */

import type { Optic } from "../optical.ts";

/**
 * Creates a sequential combinator that merging two computations `C1` and `C2`. It computes next computation twice.
 *
 * ```text
 *            +------+
 * S -------->|      |---------> A
 *            |  C1  |
 *     +------|      |<--------- B
 *     |      +------+
 *     | U
 *     |      +------+
 *     +----->|      |--------> A
 *            |  C2  |
 * T <--------|      |<-------- B
 *            +------+
 * ```
 */
export const newSequential =
    <S, U, A, B>(computation1: Optic<S, U, A, B>) =>
    <T>(computation2: Optic<U, T, A, B>): Optic<S, T, A, B> =>
    (next) =>
    (received) =>
    (callback) =>
        computation1(next)(received)((u) => computation2(next)(u)(callback));
