/* eslint-disable no-console */

/**
 * This package provides a value transformer `Cat` and associated functions.
 *
 * @packageDocumentation
 * @module
 */
import { type ControlFlow, isBreak } from "./control-flow.js";
import type { Get1, Hkt1 } from "./hkt.js";
import {
    type Eq,
    fromProjection as eqFromProjection,
} from "./type-class/eq.js";
import type { Monad } from "./type-class/monad.js";
import type { MonadFail } from "./type-class/monad-fail.js";
import type { MonadPlus } from "./type-class/monad-plus.js";
import {
    type Ord,
    fromProjection as ordFromProjection,
} from "./type-class/ord.js";
import {
    type PartialEq,
    fromProjection as partialEqFromProjection,
} from "./type-class/partial-eq.js";
import {
    type PartialOrd,
    fromProjection as partialOrdFromProjection,
} from "./type-class/partial-ord.js";

/**
 * Contains a `ctx` and can be transformed into another one by some methods.
 *
 * @typeParam M - Monad implementation which wraps `ctx`.
 * @typeParam CTX - Passing context type.
 */
export type CatT<M, CTX> = {
    /**
     * Contained context. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly ctx: Get1<M, CTX>;

    /**
     * The `Monad` instance for `M`.
     */
    readonly monad: Monad<M>;

    /**
     * Binds a new value wrapped by the monad.
     *
     * @param key - The new property key for context
     * @param value - The wrapped value to bind.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addM: <const K extends PropertyKey, A>(
        key: K,
        value: Get1<M, A>,
    ) => CatT<M, Record<K, A> & CTX>;

    /**
     * Appends a new value calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => A,
    ) => CatT<M, Record<K, A> & CTX>;

    /**
     * Runs the computation.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly run: (computation: Get1<M, never[]>) => CatT<M, CTX>;

    /**
     * Runs the computation with the context.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly runWith: (
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatT<M, CTX>;

    /**
     * Binds a new value wrapped by the monad, calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation which returns the wrapped value.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addMWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => Get1<M, A>,
    ) => CatT<M, Record<K, A> & CTX>;

    /**
     * Runs a computation if only `cond` is satisfied.
     *
     * @param cond - A condition function.
     * @param computation - A monadic operation used only if `cond` returns `true`.
     * @returns A new `CatT` with modified environment.
     */
    readonly when: (
        cond: (ctx: CTX) => boolean,
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatT<M, CTX>;

    /**
     * Runs a looping computation while it returns `Continue<S>`.
     *
     * @param initState - An initial state.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly loop: <S>(
        initState: S,
        body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
    ) => CatT<M, CTX>;

    /**
     * Runs a looping computation while `cond` returns `true`.
     *
     * @param cond - A function to decide to continue the loop.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly while: (
        cond: (ctx: CTX) => Get1<M, boolean>,
        body: (ctx: CTX) => Get1<M, never[]>,
    ) => CatT<M, CTX>;

    /**
     * Reduces the context into a value by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value.
     */
    readonly finish: <R>(fn: (ctx: CTX) => R) => Get1<M, R>;

    /**
     * Reduces the context into a value on `M` by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value on `M`.
     */
    readonly finishM: <R>(fn: (ctx: CTX) => Get1<M, R>) => Get1<M, R>;
};

/**
 * Creates a new `CatT` with the wrapped context.
 *
 * @param monad - The monad implementation for `M`.
 * @param ctx - The base context wrapped with `M`.
 * @returns A new `CatT`.
 */
export const catT =
    <M>(monad: Monad<M>) =>
    <CTX>(ctx: Get1<M, CTX>): CatT<M, CTX> => ({
        ctx,
        monad,
        addM: <const K extends PropertyKey, A>(key: K, value: Get1<M, A>) =>
            catT(monad)(
                monad.flatMap((c: CTX) =>
                    monad.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(value),
                )(ctx),
            ),
        addWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => A,
        ) =>
            catT(monad)(
                monad.map(
                    (c: CTX) =>
                        ({
                            ...c,
                            [key]: fn(c),
                        }) as Record<K, A> & CTX,
                )(ctx),
            ),
        run: (computation) =>
            catT(monad)(
                monad.flatMap((c: CTX) => monad.map(() => c)(computation))(ctx),
            ),
        runWith: (computation) =>
            catT(monad)(
                monad.flatMap((c: CTX) => monad.map(() => c)(computation(c)))(
                    ctx,
                ),
            ),
        addMWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => Get1<M, A>,
        ) =>
            catT(monad)(
                monad.flatMap((c: CTX) =>
                    monad.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(fn(c)),
                )(ctx),
            ),
        when: (cond, computation) =>
            catT(monad)(
                monad.flatMap((c: CTX) =>
                    monad.map(() => c)(
                        cond(c) ? computation(c) : monad.pure([]),
                    ),
                )(ctx),
            ),
        loop: <S>(
            initialState: S,
            body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
        ): CatT<M, CTX> => {
            const go = (state: S): Get1<M, CTX> =>
                monad.flatMap((c: CTX) =>
                    monad.flatMap(
                        (flow: ControlFlow<never[], S>): Get1<M, CTX> =>
                            isBreak(flow) ? monad.pure(c) : go(flow[1]),
                    )(body(state, c)),
                )(ctx);
            return catT(monad)(go(initialState));
        },
        while: (cond, body) => {
            const go = (ctx: Get1<M, CTX>): Get1<M, CTX> =>
                monad.flatMap((c: CTX) =>
                    monad.flatMap((bool: boolean) =>
                        bool
                            ? monad.flatMap(() => go(ctx))(body(c))
                            : monad.pure(c),
                    )(cond(c)),
                )(ctx);
            return catT(monad)(go(ctx));
        },
        finish: <R>(fn: (ctx: CTX) => R) => monad.map(fn)(ctx),
        finishM: (fn) => monad.flatMap(fn)(ctx),
    });

/**
 * Creates a new `CatT` with an empty context.
 *
 * @param monad - The monad implementation for `M`.
 * @returns A new `CatT`.
 */
export const doVoidT = <M>(monad: Monad<M>): CatT<M, never[]> =>
    catT(monad)(monad.pure([]));

/**
 * Creates a new `CatT` with an empty context.
 *
 * @param monad - The monad implementation for `M`.
 * @returns A new `CatT`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const { monad: optionMonad, none, some } = await import("./option.js");
 *
 * const optionA = some(1);
 * const optionB = some(2);
 * const optionC = some(3);
 *
 * const computation = doT(optionMonad)
 *     .addM("a", optionA)
 *     .addM("b", optionB)
 *     .addWith("bSquared", ({ b }) => b * b)
 *     .addM("c", optionC);
 *
 * expect(
 *     computation
 *         .addMWith("cSqrt", ({ c }) => {
 *             const sqrt = Math.sqrt(c);
 *             return Number.isInteger(sqrt) ? some(sqrt) : none();
 *         })
 *         .finish(({ bSquared, cSqrt }) => bSquared + cSqrt),
 * ).toStrictEqual(
 *     none(),
 * );
 *
 * const result = computation.finish(({ a, b, c }) => a + b + c);
 * expect(result).toStrictEqual(some(6));
 * ```
 */
export const doT = <M>(monad: Monad<M>): CatT<M, Record<string, never>> =>
    catT(monad)(monad.pure({}));

/**
 * Creates a new `CatT` with the context.
 *
 * @param monad - The monad implementation for `M`.
 * @param ctx - The context object.
 * @returns A new `CatT`.
 */
export const withT =
    <M>(monad: Monad<M>) =>
    <CTX extends Record<PropertyKey, unknown>>(ctx: CTX): CatT<M, CTX> =>
        catT(monad)(monad.pure(ctx));

/**
 * A {@link Cat.CatPlusT | `CatPlusT`}'s sub-combinator which chains alternate branches with its method `or`.
 *
 * @typeParam M - HKT key applied to `MonadPlus`.
 * @typeParam CTX - Passing context type.
 * @typeParam K - Key literal type to store the result of branches.
 * @typeParam T - Returning type of branches.
 */
export type CatPlusAltT<M, CTX, K extends PropertyKey, T> = {
    /**
     * Connects the computation in parallel.
     *
     * @param action - Function to make a computation from `CatPlusT`.
     * @returns A new sub-combinator with the computation made from `action`.
     */
    readonly or: (
        action: (cat: CatPlusT<M, CTX>) => Get1<M, T>,
    ) => CatPlusAltT<M, CTX, K, T>;

    /**
     * Finishes branches chain and go back to the `CatPlusT`.
     * @returns A joined combinator {@link Cat.CatPlusT | `CatPlusT`}.
     */
    readonly end: () => CatPlusT<M, Record<K, T> & CTX>;
};

const catPlusAltT =
    <M>(monadFail: MonadPlus<M>) =>
    <CTX>(ctx: Get1<M, CTX>) =>
    <K extends PropertyKey>(key: K) =>
    <T>(combined: Get1<M, T>): CatPlusAltT<M, CTX, K, T> => ({
        or: (action) =>
            catPlusAltT(monadFail)(ctx)(key)(
                monadFail.alt(combined)(action(catPlusT(monadFail)(ctx))),
            ),
        end: () =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(
                        (res: T) =>
                            ({ ...c, [key]: res }) as Record<K, T> & CTX,
                    )(combined),
                )(ctx),
            ),
    });

/**
 * A combinator which contains a `ctx` and can be transformed it into another one by its methods.
 *
 * @typeParam M - HKT key applied to `MonadPlus`.
 * @typeParam CTX - Passing context type.
 */
export type CatPlusT<M, CTX> = {
    /**
     * Contained context. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly ctx: Get1<M, CTX>;

    /**
     * The `MonadPlus` instance for `M`.
     */
    readonly monadFail: MonadPlus<M>;

    /**
     * Binds a new value wrapped by the monad.
     *
     * @param key - The new property key for context
     * @param value - The wrapped value to bind.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addM: <const K extends PropertyKey, A>(
        key: K,
        value: Get1<M, A>,
    ) => CatPlusT<M, Record<K, A> & CTX>;

    /**
     * Appends a new value calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => A,
    ) => CatPlusT<M, Record<K, A> & CTX>;

    /**
     * Runs the computation.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly run: (computation: Get1<M, never[]>) => CatPlusT<M, CTX>;

    /**
     * Runs the computation with the context.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly runWith: (
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatPlusT<M, CTX>;

    /**
     * Binds a new value wrapped by the monad, calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation which returns the wrapped value.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addMWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => Get1<M, A>,
    ) => CatPlusT<M, Record<K, A> & CTX>;

    /**
     * Runs a computation if only `cond` is satisfied.
     *
     * @param cond - A condition function.
     * @param computation - A monadic operation used only if `cond` returns `true`.
     * @returns A new `CatT` with modified environment.
     */
    readonly when: (
        cond: (ctx: CTX) => boolean,
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatPlusT<M, CTX>;

    /**
     * Runs a looping computation while it returns `Continue<S>`.
     *
     * @param initState - An initial state.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly loop: <S>(
        initState: S,
        body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
    ) => CatPlusT<M, CTX>;

    /**
     * Runs a looping computation while `cond` returns `true`.
     *
     * @param cond - A function to decide to continue the loop.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly while: (
        cond: (ctx: CTX) => Get1<M, boolean>,
        body: (ctx: CTX) => Get1<M, never[]>,
    ) => CatPlusT<M, CTX>;

    /**
     * Aborts the execution and return early.
     *
     * @returns The exiting computation.
     */
    readonly abort: () => CatPlusT<M, CTX>;

    /**
     * Asserts the condition is satisfied. Otherwise, the computation will exit.
     *
     * @param cond - The predicate which should be satisfied.
     * @returns The exiting computation when `cond` returned `false`, or does nothing.
     */
    readonly assert: (cond: (ctx: CTX) => boolean) => CatPlusT<M, CTX>;

    /**
     * Starts an alternate branches combinator {@link Cat.CatPlusAltT | `CatPlusAltT`}.
     *
     * @returns A new alternate branches combinator.
     */
    readonly alt: <K extends PropertyKey, T>(
        key: K,
        action: (cat: CatPlusT<M, CTX>) => Get1<M, T>,
    ) => CatPlusAltT<M, CTX, K, T>;

    /**
     * Reduces the context into a value by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value.
     */
    readonly finish: <R>(fn: (ctx: CTX) => R) => Get1<M, R>;

    /**
     * Reduces the context into a value on `M` by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value on `M`.
     */
    readonly finishM: <R>(fn: (ctx: CTX) => Get1<M, R>) => Get1<M, R>;
};

/**
 * Creates a new `MonadPlusT` with context wrapped in HKT `M`.
 *
 * @param monadFail - A `MonadPlus` instance for `M`.
 * @param ctx - A new context dictionary wrapped in `M`.
 * @returns A new computation combinator.
 */
export const catPlusT =
    <M>(monadFail: MonadPlus<M>) =>
    <CTX>(ctx: Get1<M, CTX>): CatPlusT<M, CTX> => ({
        ctx,
        monadFail,
        addM: <const K extends PropertyKey, A>(key: K, value: Get1<M, A>) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(value),
                )(ctx),
            ),
        addWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => A,
        ) =>
            catPlusT(monadFail)(
                monadFail.map(
                    (c: CTX) =>
                        ({
                            ...c,
                            [key]: fn(c),
                        }) as Record<K, A> & CTX,
                )(ctx),
            ),
        run: (computation) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(computation),
                )(ctx),
            ),
        runWith: (computation) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(computation(c)),
                )(ctx),
            ),
        addMWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => Get1<M, A>,
        ) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(fn(c)),
                )(ctx),
            ),
        when: (cond, computation) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(
                        cond(c) ? computation(c) : monadFail.pure([]),
                    ),
                )(ctx),
            ),
        loop: <S>(
            initialState: S,
            body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
        ): CatPlusT<M, CTX> => {
            const go = (state: S): Get1<M, CTX> =>
                monadFail.flatMap((c: CTX) =>
                    monadFail.flatMap(
                        (flow: ControlFlow<never[], S>): Get1<M, CTX> =>
                            isBreak(flow) ? monadFail.pure(c) : go(flow[1]),
                    )(body(state, c)),
                )(ctx);
            return catPlusT(monadFail)(go(initialState));
        },
        while: (cond, body) => {
            const go = (ctx: Get1<M, CTX>): Get1<M, CTX> =>
                monadFail.flatMap((c: CTX) =>
                    monadFail.flatMap((bool: boolean) =>
                        bool
                            ? monadFail.flatMap(() => go(ctx))(body(c))
                            : monadFail.pure(c),
                    )(cond(c)),
                )(ctx);
            return catPlusT(monadFail)(go(ctx));
        },
        finish: <R>(fn: (ctx: CTX) => R) => monadFail.map(fn)(ctx),
        finishM: (fn) => monadFail.flatMap(fn)(ctx),
        abort: () => catPlusT(monadFail)(monadFail.empty()),
        assert: (cond) =>
            catPlusT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(
                        cond(c)
                            ? monadFail.pure([])
                            : monadFail.empty<never[]>(),
                    ),
                )(ctx),
            ),
        alt: (key, action) =>
            catPlusAltT(monadFail)(ctx)(key)(action(catPlusT(monadFail)(ctx))),
    });

/**
 * Creates a new `MonadPlusT` with context object.
 *
 * @param monadFail - A `MonadPlus` instance for `M`.
 * @param context - A new context dictionary.
 * @returns A new computation combinator.
 */
export const withPlusT =
    <M>(monadFail: MonadPlus<M>) =>
    <CTX>(context: CTX): CatPlusT<M, CTX> =>
        catPlusT(monadFail)(monadFail.pure(context));

/**
 * Creates a new `MonadPlusT` with the empty context object.
 *
 * @param monadFail - A `MonadPlus` instance for `M`.
 * @returns A new computation combinator.
 */
export const doPlusT = <M>(
    monadFail: MonadPlus<M>,
): CatPlusT<M, Record<string, never>> => withPlusT(monadFail)({});

/**
 * A combinator which contains a `ctx` and can be transformed it into another one by its methods.
 *
 * @typeParam M - HKT key applied to `MonadFail`.
 * @typeParam CTX - Passing context type.
 */
export type CatFailT<M, CTX> = {
    /**
     * Contained context. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly ctx: Get1<M, CTX>;

    /**
     * The `MonadFail` instance for `M`.
     */
    readonly monadFail: MonadFail<M>;

    /**
     * Binds a new value wrapped by the monad.
     *
     * @param key - The new property key for context
     * @param value - The wrapped value to bind.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addM: <const K extends PropertyKey, A>(
        key: K,
        value: Get1<M, A>,
    ) => CatFailT<M, Record<K, A> & CTX>;

    /**
     * Appends a new value calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => A,
    ) => CatFailT<M, Record<K, A> & CTX>;

    /**
     * Runs the computation.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly run: (computation: Get1<M, never[]>) => CatFailT<M, CTX>;

    /**
     * Runs the computation with the context.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly runWith: (
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatFailT<M, CTX>;

    /**
     * Binds a new value wrapped by the monad, calculated from `ctx` by `fn`.
     *
     * @param key - The new property key for context
     * @param fn - The calculation which returns the wrapped value.
     * @returns A new `CatT` containing the value at the key.
     */
    readonly addMWith: <const K extends PropertyKey, A>(
        key: K,
        fn: (ctx: CTX) => Get1<M, A>,
    ) => CatFailT<M, Record<K, A> & CTX>;

    /**
     * Runs a computation if only `cond` is satisfied.
     *
     * @param cond - A condition function.
     * @param computation - A monadic operation used only if `cond` returns `true`.
     * @returns A new `CatT` with modified environment.
     */
    readonly when: (
        cond: (ctx: CTX) => boolean,
        computation: (ctx: CTX) => Get1<M, never[]>,
    ) => CatFailT<M, CTX>;

    /**
     * Runs a looping computation while it returns `Continue<S>`.
     *
     * @param initState - An initial state.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly loop: <S>(
        initState: S,
        body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
    ) => CatFailT<M, CTX>;

    /**
     * Runs a looping computation while `cond` returns `true`.
     *
     * @param cond - A function to decide to continue the loop.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly while: (
        cond: (ctx: CTX) => Get1<M, boolean>,
        body: (ctx: CTX) => Get1<M, never[]>,
    ) => CatFailT<M, CTX>;

    /**
     * Aborts the execution and return early with the error message.
     *
     * @returns The exiting computation.
     */
    readonly fail: (message: string) => CatFailT<M, CTX>;

    /**
     * Asserts the predicate or return early with the error message.
     *
     * @returns The exiting computation.
     */
    readonly assert: (
        cond: (ctx: CTX) => boolean,
        message: string,
    ) => CatFailT<M, CTX>;

    /**
     * Reduces the context into a value by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value.
     */
    readonly finish: <R>(fn: (ctx: CTX) => R) => Get1<M, R>;

    /**
     * Reduces the context into a value on `M` by `fn`.
     *
     * @param fn - The finishing computation.
     * @returns A reduced value on `M`.
     */
    readonly finishM: <R>(fn: (ctx: CTX) => Get1<M, R>) => Get1<M, R>;
};

/**
 * Creates a new `MonadFailT` with context wrapped in HKT `M`.
 *
 * @param monadFail - A `MonadFail` instance for `M`.
 * @param ctx - A new context dictionary wrapped in `M`.
 * @returns A new computation combinator.
 */
export const catFailT =
    <M>(monadFail: MonadFail<M>) =>
    <CTX>(ctx: Get1<M, CTX>): CatFailT<M, CTX> => ({
        ctx,
        monadFail,
        addM: <const K extends PropertyKey, A>(key: K, value: Get1<M, A>) =>
            catFailT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(value),
                )(ctx),
            ),
        addWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => A,
        ) =>
            catFailT(monadFail)(
                monadFail.map(
                    (c: CTX) =>
                        ({
                            ...c,
                            [key]: fn(c),
                        }) as Record<K, A> & CTX,
                )(ctx),
            ),
        run: (computation) =>
            catFailT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(computation),
                )(ctx),
            ),
        runWith: (computation) =>
            catFailT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(computation(c)),
                )(ctx),
            ),
        addMWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => Get1<M, A>,
        ) =>
            catFailT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(
                        (v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX,
                    )(fn(c)),
                )(ctx),
            ),
        when: (cond, computation) =>
            catFailT(monadFail)(
                monadFail.flatMap((c: CTX) =>
                    monadFail.map(() => c)(
                        cond(c) ? computation(c) : monadFail.pure([]),
                    ),
                )(ctx),
            ),
        loop: <S>(
            initialState: S,
            body: (state: S, ctx: CTX) => Get1<M, ControlFlow<never[], S>>,
        ): CatFailT<M, CTX> => {
            const go = (state: S): Get1<M, CTX> =>
                monadFail.flatMap((c: CTX) =>
                    monadFail.flatMap(
                        (flow: ControlFlow<never[], S>): Get1<M, CTX> =>
                            isBreak(flow) ? monadFail.pure(c) : go(flow[1]),
                    )(body(state, c)),
                )(ctx);
            return catFailT(monadFail)(go(initialState));
        },
        while: (cond, body) => {
            const go = (ctx: Get1<M, CTX>): Get1<M, CTX> =>
                monadFail.flatMap((c: CTX) =>
                    monadFail.flatMap((bool: boolean) =>
                        bool
                            ? monadFail.flatMap(() => go(ctx))(body(c))
                            : monadFail.pure(c),
                    )(cond(c)),
                )(ctx);
            return catFailT(monadFail)(go(ctx));
        },
        finish: <R>(fn: (ctx: CTX) => R) => monadFail.map(fn)(ctx),
        finishM: (fn) => monadFail.flatMap(fn)(ctx),
        fail: (message) => catFailT(monadFail)(monadFail.fail(message)),
        assert: (cond, message) =>
            catFailT(monadFail)(
                monadFail.flatMap(
                    (c: CTX): Get1<M, CTX> =>
                        monadFail.map(() => c)(
                            cond(c)
                                ? monadFail.pure([])
                                : monadFail.fail(message),
                        ),
                )(ctx),
            ),
    });

/**
 * Creates a new `MonadFailT` with a context.
 *
 * @param monadFail - A `MonadFail` instance for `M`.
 * @param ctx - A new context dictionary.
 * @returns A new computation combinator.
 */
export const withFailT =
    <M>(monadFail: MonadFail<M>) =>
    <CTX>(context: CTX): CatFailT<M, CTX> =>
        catFailT(monadFail)(monadFail.pure(context));

/**
 * Creates a new `MonadFailT` with the empty context.
 *
 * @param monadFail - A `MonadFail` instance for `M`.
 * @returns A new computation combinator.
 */
export const doFailT = <M>(
    monadFail: MonadFail<M>,
): CatFailT<M, Record<string, never>> => withFailT(monadFail)({});

/**
 * Hkt dictionary key for `Cat<_>`.
 */
export interface CatHkt extends Hkt1 {
    readonly type: Cat<this["arg1"]>;
}

/**
 * Contains a `value` and can be transformed into another one by `feed`.
 *
 * @typeParam T - Type of value, contained by `Cat`.
 */
export type Cat<T> = {
    /**
     * Contained value. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly value: T;
    /**
     * Feeds a function to the `Cat`, then `Cat` creates a new `Cat` by calling it.
     *
     * @param fn - A map function for `value`, having referential-transparency is expected.
     * @returns A new `Cat` transformed from `value` by `fn`.
     */
    readonly feed: <U>(fn: (t: T) => U) => Cat<U>;
};
/**
 * Creates a new `Cat` contained `value`.
 *
 * @param value - A value will be contained.
 * @returns A new created `Cat`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const result = cat(-3)
 *     .feed((x) => x ** 2)
 *     .feed((x) => x.toString());
 * expect(result.value).toStrictEqual("9");
 * ```
 */
export const cat = <T>(value: T): Cat<T> => ({
    value,
    feed: <U>(fn: (t: T) => U) => cat(fn(value)),
});

/**
 * Gets the contained value from `Cat`. It is convenient to apply the getter for projection to some functor.
 *
 * @param cat - Source `Cat`.
 * @returns Contained value.
 */
export const get = <T>({ value }: Cat<T>): T => value;

/**
 * Creates a `PartialEq` comparator for `Cat` from another existing one.
 */
export const partialEq: <T>(equality: PartialEq<T>) => PartialEq<Cat<T>> =
    partialEqFromProjection<CatHkt>(get);
/**
 * Creates a `Eq` comparator for `Cat` from another existing one.
 */
export const eq: <T>(equality: Eq<T>) => Eq<Cat<T>> =
    eqFromProjection<CatHkt>(get);
/**
 * Creates a `PartialOrd` comparator for `Cat` from another existing one.
 */
export const partialOrd: <T>(order: PartialOrd<T>) => PartialOrd<Cat<T>> =
    partialOrdFromProjection<CatHkt>(get);
/**
 * Creates a `Ord` comparator for `Cat` from another existing one.
 */
export const ord: <T>(order: Ord<T>) => Ord<Cat<T>> =
    ordFromProjection<CatHkt>(get);

/**
 * Inspects the passing value with an inspector. It is useful for using some side effects.
 *
 * @param inspector - An inspector to see the passing value.
 * @returns An identity function.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const result = cat(-3)
 *     .feed(inspect((x) => expect(x).toStrictEqual(-3)))
 *     .feed((x) => x ** 2)
 *     .feed(inspect((x) => expect(x).toStrictEqual(9)))
 *     .feed((x) => x.toString())
 *     .feed(inspect((x) => expect(x).toStrictEqual("9")));
 * expect(result.value).toStrictEqual("9");
 * ```
 */
export const inspect =
    <T>(inspector: (t: T) => void) =>
    (t: T): T => {
        inspector(t);
        return t;
    };

/**
 * An inspector which applied `console.log` to `inspect`.
 */
export const log = <T>(t: T): T => inspect<T>(console.log)(t);
/**
 * An inspector which applied `console.debug` to `inspect`.
 */
export const debug = <T>(t: T): T => inspect<T>(console.debug)(t);
/**
 * An inspector which applied `console.info` to `inspect`.
 */
export const info = <T>(t: T): T => inspect<T>(console.info)(t);
/**
 * An inspector which applied `console.warn` to `inspect`.
 */
export const warn = <T>(t: T): T => inspect<T>(console.warn)(t);
/**
 * An inspector which applied `console.error` to `inspect`.
 */
export const error = <T>(t: T): T => inspect<T>(console.error)(t);
/**
 * An inspector which applied `console.dir` to `inspect`.
 */
export const dir = <T>(t: T): T => inspect<T>(console.dir)(t);
/**
 * An inspector which applied `console.dirxml` to `inspect`.
 */
export const dirxml = <T>(t: T): T => inspect<T>(console.dirxml)(t);
/**
 * An inspector which applied `console.table` to `inspect`.
 */
export const table = <T>(t: T): T => inspect<T>(console.table)(t);

/**
 * Flattens a nested `Cat`. Only it extracts the contained `value`.
 *
 * @param catCat - A nested `Cat`.
 * @returns A flattened `Cat`.
 */
export const flatten = <T>(catCat: Cat<Cat<T>>): Cat<T> => catCat.value;

/**
 * Makes tuples from two `Cat`s.
 *
 * @param a - A `Cat` to be placed at left.
 * @param b - A `Cat` to be placed at right.
 * @returns A composed `Cat`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const actual = product(cat(5))(cat("foo")).value;
 * expect(actual).toStrictEqual([5, "foo"]);
 * ```
 */
export const product =
    <A>(a: Cat<A>) =>
    <B>(b: Cat<B>): Cat<[A, B]> =>
        cat([a.value, b.value]);

/**
 * Maps an inner value of a `Cat` into another one by applying a function. It is useful to lift a function for `Cat`.
 *
 * @param fn - A function which maps from `T` to `U`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const actual = map((v: number) => v / 2)(cat(10)).value;
 * expect(actual).toStrictEqual(5);
 * ```
 */
export const map =
    <T, U>(fn: (t: T) => U) =>
    (c: Cat<T>): Cat<U> =>
        c.feed(fn);

/**
 * Maps an inner value of `Cat` into another `Cat` by applying a function. It is useful to lift a subroutine with `Cat`.
 *
 * @param fn - A function which maps from `T` to `Cat<U>`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const sub = (num: number): Cat<string> =>
 *     cat(num).feed((x) => x.toString());
 * const actual = flatMap(sub)(cat(6)).value;
 * expect(actual).toStrictEqual("6");
 * ```
 */
export const flatMap =
    <T, U>(fn: (t: T) => Cat<U>) =>
    (c: Cat<T>): Cat<U> =>
        flatten(map(fn)(c));

/**
 * Lifts down a `Cat` which contains a mapping function. It is useful to decompose a function in `Cat`.
 *
 * @param fn - A `Cat` which contains a mapping function.
 * @returns An applied function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const sub = cat((numeral: string) => parseInt(numeral, 10));
 * const actual = apply(sub)(cat("1024")).value;
 * expect(actual).toStrictEqual(1024);
 * ```
 */
export const apply =
    <T1, U1>(fn: Cat<(t: T1) => U1>) =>
    (t: Cat<T1>): Cat<U1> =>
        flatMap(t.feed)(fn);

/**
 * The monad implementation of `Cat`.
 */
export const monad: Monad<CatHkt> = {
    pure: cat,
    map,
    flatMap,
    apply,
};
