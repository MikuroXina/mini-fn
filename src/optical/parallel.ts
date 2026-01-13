/**
 * @packageDocumentation
 * @module
 *
 * A parallel combinator that merging two computations `C1` and `C2`.
 *
 * ```text
 *                        +------+  A1
 * S --------------+----->|      |--------------+
 *                 |  T1  |  C1  |              |
 *          +------|------|      |<------+      V
 *          |      |      +------+       |  [ joinA ]--> A
 *          V      |                     |      ^
 * T <--[ joinT ]  |      +------+  A2   |      |
 *          ^      |----->|      |-------|------+
 *          |         T2  |  C2  |       |
 *          +-------------|      |<------+-------------- B
 *                        +------+
 * ```
 */

import { absurd } from "../func.js";
import type { Optic } from "../optical.js";

/**
 * Creates a new parallel combinator that merging two computations `C1` and `C2`.
 *
 * ```text
 *                        +------+  A1
 * S --------------+----->|      |--------------+
 *                 |  T1  |  C1  |              |
 *          +------|------|      |<------+      V
 *          |      |      +------+       |  [ joinA ]--> A
 *          V      |                     |      ^
 * T <--[ joinT ]  |      +------+  A2   |      |
 *          ^      |----->|      |-------|------+
 *          |         T2  |  C2  |       |
 *          +-------------|      |<------+-------------- B
 *                        +------+
 * ```
 */
export const newParallel =
    <T, T1, T2>(joinT: (t1: T1) => (t2: T2) => T) =>
    <A, A1, A2>(joinA: (a1: A1) => (a2: A2) => A) =>
    <S, B>(computation1: Optic<S, T1, A1, B>) =>
    (computation2: Optic<S, T2, A2, B>): Optic<S, T, A, B> =>
    <R>(next: (sending: A) => (continuation: (returned: B) => R) => R) =>
    (received: S) =>
    (callback: (t: T) => R): R =>
        computation1<R>(
            (sending1) => (continuation1) =>
                computation2<R>(
                    (sending2) => () =>
                        next(joinA(sending1)(sending2))(continuation1),
                )(received)(absurd),
        )(received)((t1) =>
            computation2<R>(
                (sending2) => (continuation2) =>
                    computation1<R>(
                        (sending1) => () =>
                            next(joinA(sending1)(sending2))(continuation2),
                    )(received)(absurd),
            )(received)((t2) => callback(joinT(t1)(t2))),
        );
