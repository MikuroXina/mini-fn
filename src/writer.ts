/**
 * This package provides methods for a computation which allows writing into external records.
 *
 * A {@link Writer.Writer | `Writer<W, A>`} object represents a computation, returning `A` and writing `W` out:
 *
 * ```ts
 * type Writer<W, A> = () => [returned: A, written: W];
 * // Note that the actual code is defined as a special case of `WriterT`.
 * ```
 *
 * And you can work with it by the following methods:
 *
 * - {@link Writer.censor | `censor`} - Censors and transforms data to be written.
 * - {@link Writer.listen | `listen`} - Listens the written record.
 * - {@link Writer.pass | `pass`} - Applies the function returned from a {@link Writer.Writer | `Writer`} to a record.
 * - {@link Writer.tell | `tell`} - Writes data as a record.
 * - {@link Writer.evaluateWriter | `evaluateWriter`} - Runs a {@link Writer.Writer | `Writer`} and gets only the result.
 * - {@link Writer.executeWriter | `executeWriter`} - Runs a {@link Writer.Writer | `Writer`} and gets only the written record.
 * - {@link Writer.mapWriter | `mapWriter`} - Transforms output and record of a {@link Writer.Writer | `Writer`}.
 *
 * Moreover a {@link Writer.WriterT | `WriterT<R, M, A>`} monad transformer is the generalized version of {@link Writer.Writer | `Writer<R, A>`}. It returns not `A`, but object on monad `M`.
 *
 * @packageDocumentation
 * @module
 */

import type { Apply2Only, Get1, Hkt2, Hkt3 } from "./hkt.ts";
import type { IdentityHkt } from "./identity.ts";
import type { Tuple } from "./tuple.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Monoid } from "./type-class/monoid.ts";
import type { SemiGroup } from "./type-class/semi-group.ts";

/**
 * The write monad transformer, the computation which returns the result `A` and output `W` on `M`.
 */
export interface WriterT<W, M, A> {
    (): Get1<M, [A, W]>;
}

/**
 * Extracts the output from the computation.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param w - The computation.
 * @returns The output of `w`.
 */
export const executeWriterT =
    <M>(monad: Monad<M>) => <W, A>(w: WriterT<W, M, A>): Get1<M, W> =>
        monad.map(([, nextWriter]: [A, W]) => nextWriter)(w());
/**
 * Maps both the result and output of the computation with `fn`.
 *
 * @param fn - The function to map the result and output.
 * @param w - The computation to be mapped.
 * @returns The mapped computation.
 */
export const mapWriterT =
    <M, N, A, B, W1, W2>(fn: (maw: Get1<M, [A, W1]>) => Get1<N, [B, W2]>) =>
    (w: WriterT<W1, M, A>): WriterT<W2, N, B> =>
    () => fn(w());

/**
 * Puts the output value as a computation on `Writer`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param w - The output value to put.
 * @returns The computation which puts the output.
 */
export const tellM =
    <M>(monad: Monad<M>) => <W>(w: W): WriterT<W, M, never[]> => () =>
        monad.pure([[], w]);
/**
 * Creates an action that executes `writer` and adds its output to the value of the computation.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param writer - The computation to listen.
 * @returns The computation that adds its output to the value.
 */
export const listenM =
    <M>(monad: Monad<M>) =>
    <W, A>(writer: WriterT<W, M, A>): WriterT<W, M, [A, W]> =>
    () => monad.map(([a, w]: [A, W]): [[A, W], W] => [[a, w], w])(writer());
/**
 * Creates an action that executes `writer`, maps its output and adds to that value of the computation.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param writer - The function to map the listened output.
 * @param writer - The computation to listen.
 * @returns The computation that adds its output to the value.
 */
export const listensM =
    <M>(monad: Monad<M>) =>
    <W, B>(mapper: (w: W) => B) =>
    <A>(writer: WriterT<W, M, A>): WriterT<W, M, [A, B]> =>
    () =>
        monad.map(([a, w]: [A, W]): [[A, B], W] => [[a, mapper(w)], w])(
            writer(),
        );
/**
 * Creates an action which passes a function to the state returned from the computation `writer`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param writer - The computation which returns a function to pass.
 * @returns The computation with a passed state.
 */
export const passM =
    <M>(monad: Monad<M>) =>
    <W, A>(writer: WriterT<W, M, [A, (w: W) => W]>): WriterT<W, M, A> =>
    () =>
        monad.map(([[a, f], w]: [[A, (w: W) => W], W]): [A, W] => [a, f(w)])(
            writer(),
        );

/**
 * Creates an action which censors the computation `writer` with `cense`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param cense - The function to cense the state.
 * @param writer - The computation to be censored.
 * @returns The censored computation.
 */
export const censorM =
    <M>(monad: Monad<M>) =>
    <W>(cense: (w: W) => W) =>
    <A>(writer: WriterT<W, M, A>): WriterT<W, M, A> =>
    () => monad.map(([a, w]: [A, W]): [A, W] => [a, cense(w)])(writer());

/**
 * The write monad, the computation which returns the result `A` and output `W`.
 */
export type Writer<W, A> = WriterT<W, IdentityHkt, A>;

/**
 * Evaluates the computation and returns the result.
 *
 * @param w - Thw writer to be evaluated.
 * @returns The evaluation of the computation.
 */
export const evaluateWriter = <W, A>(w: Writer<W, A>): A => w()[0];
/**
 * Executes the computation and returns the output state.
 *
 * @param w - The writer to be executed.
 * @returns The execution of the computation.
 */
export const executeWriter = <W, A>(w: Writer<W, A>): W => w()[1];
/**
 * Maps a result of the computation with `fn`.
 *
 * @param fn - The function to map a result of the computation.
 * @param w - The computation to be mapped.
 * @returns The mapped computation.
 */
export const mapWriter =
    <A, B, W1, W2>(fn: (aw: [A, W1]) => [B, W2]) =>
    (w: Writer<W1, A>): Writer<W2, B> =>
    () => fn(w());

/**
 * Creates an action which returns the new state `w`.
 *
 * @param w - The new state to tell.
 * @returns The empty computation which returns the new state.
 */
export const tell = <W>(w: W): Writer<W, never[]> => () => [[], w];
/**
 * Creates an action that executes `writer` and adds its output to the value of the computation.
 *
 * @param writer - The computation to be listened.
 * @returns The computation that adds its output to the value.
 */
export const listen = <W, A>(writer: Writer<W, A>): Writer<W, [A, W]> => () => {
    const [a, w] = writer();
    return [[a, w], w];
};
/**
 * Creates an action that executes `writer`, maps its output and adds to the value of the computation.
 *
 * @param mapper - The function to map the output of the computation.
 * @param writer - The computation to be listened.
 * @returns The computation that adds its output to the value.
 */
export const listens =
    <W, B>(mapper: (w: W) => B) =>
    <A>(writer: Writer<W, A>): Writer<W, [A, B]> =>
    () => {
        const [a, w] = writer();
        return [[a, mapper(w)], w];
    };
/**
 * Creates an action which passes a function to the state returned from the computation `writer`.
 *
 * @param writer - The computation which returns a function to pass.
 * @returns The computation with a passed state.
 */
export const pass =
    <W, A>(writer: Writer<W, [A, (w: W) => W]>): Writer<W, A> => () => {
        const [[a, f], w] = writer();
        return [a, f(w)];
    };

/**
 * Creates an action which censors the computation `writer` with `cense`.
 *
 * @param cense - The function to cense the state.
 * @param writer - The computation to be censored.
 * @returns The censored computation.
 */
export const censor =
    <W>(cense: (w: W) => W) => <A>(writer: Writer<W, A>): Writer<W, A> =>
    () => {
        const [a, w] = writer();
        return [a, cense(w)];
    };

/**
 * Makes two computations into one with monoid `W`.
 *
 * @param monoid - The instance of `Monoid` for `W`.
 * @param a - The left-side computation.
 * @param b - The right-side computation.
 * @returns The computation which returns a product of them as a result.
 */
export const product =
    <W>(monoid: Monoid<W>) =>
    <A>(a: Writer<W, A>) =>
    <B>(b: Writer<W, B>): Writer<W, Tuple<A, B>> =>
    () => {
        const [aEval, aExec] = a();
        const [bEval, bExec] = b();
        return [[aEval, bEval], monoid.combine(aExec, bExec)];
    };
/**
 * Creates a new computation with new `a` and monoid `W`.
 *
 * @param monoid - The instance of `Monoid` for `W`.
 * @param a - The value to be contained.
 * @returns The new computation with the result from `a` and output from `monoid.identity`.
 */
export const pure = <W>(monoid: Monoid<W>) => <T>(a: T): Writer<W, T> => () => [
    a,
    monoid.identity,
];
/**
 * Maps the result of computation with `f`.
 *
 * @param f - The function to map the result.
 * @returns The mapped computation.
 */
export const map =
    <T, U>(f: (t: T) => U) => <W>(w: Writer<W, T>): Writer<W, U> => () => {
        const [ans, write] = w();
        return [f(ans), write];
    };
/**
 * Maps and flattens the result of computation with `f`.
 *
 * @param semi - The instance of `SemiGroup` for `W`.
 * @param f - The function to map the result.
 * @returns The mapped and flattened computation.
 */
export const flatMap =
    <W>(semi: SemiGroup<W>) =>
    <T, U>(fn: (t: T) => Writer<W, U>) =>
    (t: Writer<W, T>): Writer<W, U> =>
    () => {
        const [ansT, writeT] = t();
        const [ansU, writeU] = fn(ansT)();
        return [ansU, semi.combine(writeT, writeU)];
    };
/**
 * Applies the function returned by the computation to another computation.
 *
 * @param semi - The instance of `SemiGroup` for `W`.
 * @param fn - The computation which returns a function to apply as a result.
 * @param t - The computation to be applied.
 * @returns The applied computation.
 */
export const apply =
    <W>(semi: SemiGroup<W>) =>
    <T, U>(fn: Writer<W, (t: T) => U>) =>
    (t: Writer<W, T>): Writer<W, U> =>
    () => {
        const [mapped, writeT] = fn();
        const [ans, writeU] = t();
        return [mapped(ans), semi.combine(writeT, writeU)];
    };

export interface WriterTHkt extends Hkt3 {
    readonly type: WriterT<this["arg3"], this["arg2"], this["arg1"]>;
}

export interface WriterHkt extends Hkt2 {
    readonly type: Writer<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Writer`.
 */
export const functor = <M>(): Functor<Apply2Only<WriterHkt, M>> => ({ map });

/**
 * Creates a monad instance from monoid `W`.
 *
 * @param monoid - The instance of `Monoid` for `W`.
 * @returns The instance of `Monad` for `Writer<W, _>`.
 */
export const makeMonad = <W>(
    monoid: Monoid<W>,
): Monad<Apply2Only<WriterHkt, W>> => ({
    pure: pure(monoid),
    map,
    flatMap: flatMap(monoid),
    apply: apply(monoid),
});
