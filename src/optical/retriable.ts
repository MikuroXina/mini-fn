/**
 * @packageDocumentation
 *
 * A retriable optical which consists three functions:
 *
 * - `triable`: An operation that may fail.
 * - `strategy`: Failure control strategy, which decides the operation should retry or exit.
 * - `set`: A function that stores `B` into `S` and produces `T`.
 *
 * ```text
 *                       ok
 * S -+--->[ triable ]-+-------> A
 *    |         ^      |
 *    |   retry |      | err
 *    |         |      V
 *    |       [ strategy ]
 *    |        |
 *    +--------|-------+
 *             | exit  |
 *             |       V
 * T <---------+----[ set ]<- B
 * ```
 */

import {
    type ControlFlow,
    isBreak,
    newBreak,
    newContinue,
} from "../control-flow.ts";
import type { Optical } from "../optical.ts";
import { isOk, type Result } from "../result.ts";
import type { Monad } from "../type-class/monad.ts";
import type { Get1 } from "../hkt.ts";
import { doT } from "../cat.ts";
import { callCC, type ContT, lift, monad as contTMonad } from "../cont.ts";
import { monad as promiseMonad, PromiseHkt } from "../promise.ts";

/**
 * Creates a retriable optical which consists three functions:
 *
 * - `triable`: An operation that may fail.
 * - `strategy`: Failure control strategy, which decides the operation should retry or exit.
 * - `set`: A function that stores `B` into `S` and produces `T`.
 *
 * ```text
 *                       ok
 * S -+--->[ triable ]-+-------> A
 *    |         ^      |
 *    |   retry |      | err
 *    |         |      V
 *    |       [ strategy ]
 *    |        |
 *    +--------|-------+
 *             | exit  |
 *             |       V
 * T <---------+----[ set ]<- B
 * ```
 *
 * @param monad - A `Monad` instance for `M`.
 * @param initialState - An initial state for `triable` and `strategy`.
 * @param strategy - A function which decides whether `triable` should be rerun.
 * @param triable - An operation that may fail.
 * @param set - A function to substitute the data `S`.
 * @returns The retriable optical.
 */
export const newRetriable =
    <M>(monad: Monad<M>) =>
    <I>(initialState: I) =>
    <E, T>(strategy: (err: E) => (state: I) => Get1<M, ControlFlow<T, I>>) =>
    <S, A>(triable: (data: S) => (state: I) => Get1<M, Result<E, A>>) =>
    <B>(set: (data: S) => (modified: B) => T): Optical<M, S, T, A, B> =>
    <R>(next: (sending: A) => ContT<R, M, B>) =>
    (received: S): ContT<R, M, T> => {
        const contMonad = contTMonad<R, M>();
        const sub =
            (exit: (res: T) => ContT<R, M, ControlFlow<T, I>>) =>
            (state: I): ContT<R, M, T> =>
                doT(contMonad).addM(
                    "res",
                    lift(monad)(triable(received)(state)),
                )
                    .addMWith(
                        "flow",
                        ({ res }): ContT<R, M, ControlFlow<T, I>> =>
                            isOk(res)
                                ? contMonad.flatMap((b: B) =>
                                    exit(set(received)(b))
                                )(next(res[1]))
                                : lift(monad)(strategy(res[1])(state)),
                    ).addMWith("decision", ({ flow }) =>
                        isBreak(flow)
                            ? contMonad.pure(flow[1])
                            : sub(exit)(flow[1]))
                    .finish(({ decision }) =>
                        decision
                    );
        return callCC<R, M, T, ControlFlow<T, I>>((exit) =>
            sub(exit)(initialState)
        );
    };

/**
 * Creates a retriable optical by exponential backoff method. It increases the delay duration (100 milliseconds) multiplied by the power of two, but its exponent stops at 23.
 *
 * @param maxRetries - Maximum retry counts.
 * @param waiter - The waiter function to delay. Defaults to `setTimeout` method.
 * @param triable - An operation that may fail.
 * @param set - A function to substitute the data `S`.
 * @returns The retriable optical.
 */
export const exponentialBackoff = (
    maxRetries: number,
    waiter: (milliseconds: number) => Promise<void> = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms)),
) =>
<E, T>(
    fallback: (err: E) => T,
): <S, A>(
    triable: (data: S) => (state: number) => Promise<Result<E, A>>,
) => <B>(
    set: (data: S) => (modified: B) => T,
) => Optical<PromiseHkt, S, T, A, B> =>
    newRetriable(promiseMonad)(0)((err: E) => async (attempt) => {
        if (attempt >= maxRetries) {
            return newBreak(fallback(err));
        }
        const delay = 100 << Math.min(23, attempt);
        await waiter(delay);
        return newContinue(attempt + 1);
    });
