import { type CatT, catT } from "../cat.ts";
import type { Get1 } from "../hkt.ts";
import type { Result } from "../result.ts";
import type { Monad } from "./monad.ts";

/**
 * A monad which allows making the computation value into a `Result` with an error context message.
 */
export interface ErrorMonad<M> extends Monad<M> {
    /**
     * Converts a computation value into a `Result` with a message `context`.
     *
     * @param context - The message to be included to an error.
     * @param computation - The extracting computation with a value.
     * @returns The extracted value or an `Error` if failed.
     */
    readonly context: (
        context: string,
    ) => <T>(computation: Get1<M, T>) => Result<Error, T>;
    /**
     * Converts a computation value into a `Result` with a function `fn` creating a message.
     *
     * @param fn - The function to create a message to be included to an error.
     * @param computation - The extracting computation with a value.
     * @returns The extracted value or an `Error` if failed.
     */
    readonly withContext: (
        fn: () => string,
    ) => <T>(computation: Get1<M, T>) => Result<Error, T>;
}

/**
 * A `CatT` which helps you to handle a fail-able computation with an error message. Your provided context message will be used in message value of an `Error` object.
 */
export type ErrorCat<M, T> =
    & CatT<M, T>
    & Readonly<{
        context: (context: string) => Result<Error, T>;
        withContext: (fn: () => string) => Result<Error, T>;
    }>;

/**
 * Creates a `ErrorCat` from the `ErrorMonad` instance and environment.
 *
 * @param monad - The `ErrorMonad` instance for `M`,
 * @param value - The computation environment.
 * @returns The `ErrorCat` instance.
 */
export const errorCat = <M>(monad: ErrorMonad<M>) =>
<T>(
    env: Get1<M, T>,
): ErrorCat<M, T> => ({
    ...catT(monad)(env),
    context: (context) => monad.context(context)(env),
    withContext: (fn) => monad.withContext(fn)(env),
});

/**
 * Creates a `ErrorCat` from the `ErrorMonad` instance.
 *
 * @param monad - The `ErrorMonad` instance for `M`,
 * @returns The `ErrorCat` instance with an empty environment.
 */
export const doError = <M>(
    monad: ErrorMonad<M>,
): ErrorCat<M, Record<string, never>> =>
    errorCat(monad)(monad.pure({} as Record<string, never>));
