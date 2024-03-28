/**
 * @packageDocumentation
 *
 * A parallel combinator that merging two computations `C1` and `C2`.
 *
 * ```text
 *                        S1  +------+  A1
 *                     +----->|      |------+
 *                     |  T1  |  C1  |  B1  |
 *                  +--|------|      |<-----|--+
 *                  |  |      +------+      |  |
 *  Tuple<S2, S1> -----+                    +-----> Result<A2, A1>
 *                  |  |  S2  +------+  A2  |  |
 * Result<T2, T1> <-+  +----->|      |------+  +--- Result<B2, B1>
 *                  |     T2  |  C2  |  B2     |
 *                  +---------|      |<--------+
 *                            +------+
 * ```
 */

import type { Optic } from "../optical.ts";
import { err, isOk, ok, type Result } from "../result.ts";
import type { Tuple } from "../tuple.ts";

/**
 * Creates a new parallel combinator that merging two computations `C1` and `C2`.
 *
 * ```text
 *                        S1  +------+  A1
 *                     +----->|      |------+
 *                     |  T1  |  C1  |  B1  |
 *                  +--|------|      |<-----|--+
 *                  |  |      +------+      |  |
 *  Tuple<S2, S1> -----+                    +-----> Result<A2, A1>
 *                  |  |  S2  +------+  A2  |  |
 * Result<T2, T1> <-+  +----->|      |------+  +--- Result<B2, B1>
 *                  |     T2  |  C2  |  B2     |
 *                  +---------|      |<--------+
 *                            +------+
 * ```
 */
export const newParallel =
    <S2, T2, A2, B2>(computation2: Optic<S2, T2, A2, B2>) =>
    <S1, T1, A1, B1>(
        computation1: Optic<S1, T1, A1, B1>,
    ): Optic<Tuple<S2, S1>, Result<T2, T1>, Result<A2, A1>, Result<B2, B1>> =>
    <R>(
        next: (
            sending: Result<A2, A1>,
        ) => (continuation: (returned: Result<B2, B1>) => R) => R,
    ) =>
    (received: Tuple<S2, S1>) =>
    (callback: (t: Result<T2, T1>) => R): R =>
        computation1<R>((sending) => (continuation) =>
            next(ok(sending))((returned) =>
                isOk(returned)
                    ? continuation(returned[1])
                    : computation2<R>(() => (continuation) =>
                        continuation(returned[1])
                    )(received[0])((t2) => callback(err(t2)))
            )
        )(received[1])((t1) => callback(ok(t1)));
