/* eslint-disable no-console */

/**
 * This package provides a value transformer `Cat` and associated functions.
 *
 * @packageDocumentation
 */
import { type ControlFlow, isBreak } from "./control-flow.ts";
import type { Get1, Hkt1 } from "./hkt.ts";
import { foldL } from "./list.ts";
import { List } from "./list.ts";
import { fromProjection as eqFromProjection } from "./type-class/eq.ts";
import type { Monad } from "./type-class/monad.ts";
import { fromProjection as ordFromProjection } from "./type-class/ord.ts";
import { fromProjection as partialEqFromProjection } from "./type-class/partial-eq.ts";
import { fromProjection as partialOrdFromProjection } from "./type-class/partial-ord.ts";

/**
 * Contains a `ctx` and can be transformed into another one by some methods.
 *
 * @typeParam M - Monad implementation which wraps `ctx`.
 * @typeParam CTX - Passing context type.
 */
export interface CatT<M, CTX> {
    /**
     * Contained context. Altering an interior value must be abstained, or may occurs unsound behaviors.
     */
    readonly ctx: Get1<M, CTX>;

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
    readonly run: (computation: Get1<M, []>) => CatT<M, CTX>;

    /**
     * Runs the computation with the context.
     *
     * @param computation - The computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly runWith: (computation: (ctx: CTX) => Get1<M, []>) => CatT<M, CTX>;

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
        computation: (ctx: CTX) => Get1<M, []>,
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
        body: (state: S, ctx: CTX) => Get1<M, ControlFlow<[], S>>,
    ) => CatT<M, CTX>;

    /**
     * Runs a looping computation while `cond` returns `true`.
     *
     * @param cond - A function to decide to continue the loop.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly while: (
        cond: (ctx: CTX) => boolean,
        body: (ctx: CTX) => Get1<M, []>,
    ) => CatT<M, CTX>;

    /**
     * Runs a looping computation with items from the list.
     *
     * @param iter - A list to be iterated.
     * @param body - A computation to run.
     * @returns A new `CatT` with modified environment.
     */
    readonly foreach: <T>(
        iter: List<T>,
        body: (item: T, ctx: CTX) => Get1<M, []>,
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
}

/**
 * Creates a new `CatT` with the wrapped context.
 *
 * @param monad - The monad implementation for `M`.
 * @param ctx - The base context wrapped with `M`.
 * @returns A new `CatT`.
 */
export const catT =
    <M>(monad: Monad<M>) => <CTX>(ctx: Get1<M, CTX>): CatT<M, CTX> => ({
        ctx,
        addM: <const K extends PropertyKey, A>(key: K, value: Get1<M, A>) =>
            catT(monad)(
                monad.flatMap((c: CTX) =>
                    monad.map((v: A) =>
                        ({ ...c, [key]: v }) as Record<K, A> & CTX
                    )(value)
                )(ctx),
            ),
        addWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => A,
        ) => catT(monad)(
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
                monad.flatMap(
                    (c: CTX) => monad.map(() => c)(computation(c)),
                )(ctx),
            ),
        addMWith: <const K extends PropertyKey, A>(
            key: K,
            fn: (ctx: CTX) => Get1<M, A>,
        ) => catT(monad)(
            monad.flatMap((c: CTX) =>
                monad.map((v: A) => ({ ...c, [key]: v }) as Record<K, A> & CTX)(
                    fn(c),
                )
            )(ctx),
        ),
        when: (cond, computation) =>
            catT(monad)(
                monad.flatMap(
                    (c: CTX) =>
                        monad.map(() => c)(
                            cond(c) ? computation(c) : monad.pure([]),
                        ),
                )(ctx),
            ),
        loop: <S>(
            initialState: S,
            body: (state: S, ctx: CTX) => Get1<M, ControlFlow<[], S>>,
        ): CatT<M, CTX> => {
            const go = (state: S): Get1<M, CTX> =>
                monad.flatMap((c: CTX) =>
                    monad.flatMap((flow: ControlFlow<[], S>): Get1<M, CTX> =>
                        isBreak(flow) ? monad.pure(c) : go(flow[1])
                    )(body(state, c))
                )(ctx);
            return catT(monad)(go(initialState));
        },
        while: (cond, body) => {
            const go = (ctx: Get1<M, CTX>): Get1<M, CTX> =>
                monad.flatMap((c: CTX) =>
                    cond(c)
                        ? monad.flatMap(() => go(ctx))(body(c))
                        : monad.pure(c)
                )(ctx);
            return catT(monad)(go(ctx));
        },
        foreach: <T>(
            iter: List<T>,
            body: (item: T, ctx: CTX) => Get1<M, []>,
        ): CatT<M, CTX> =>
            catT(monad)(
                foldL((acc: Get1<M, CTX>) => (item: T) =>
                    monad.flatMap((c: CTX) =>
                        monad.map(() => c)(body(item, c))
                    )(acc)
                )(ctx)(iter),
            ),
        finish: <R>(fn: (ctx: CTX) => R) => monad.map(fn)(ctx),
        finishM: (fn) => monad.flatMap(fn)(ctx),
    });

/**
 * Creates a new `CatT` with an empty context.
 *
 * @param monad - The monad implementation for `M`.
 * @returns A new `CatT`.
 */
export const doVoidT = <M>(monad: Monad<M>): CatT<M, []> =>
    catT(monad)(monad.pure([]));

/**
 * Creates a new `CatT` with an empty context.
 *
 * @param monad - The monad implementation for `M`.
 * @returns A new `CatT`.
 *
 * # Examples
 *
 * ```ts
 * import { monad as optionMonad, none, some } from "./option.ts";
 * import { assertEquals } from "../deps.ts";
 * import { doT } from "./cat.ts";
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
 * assertEquals(
 *     computation
 *         .addMWith("cSqrt", ({ c }) => {
 *             const sqrt = Math.sqrt(c);
 *             return Number.isInteger(sqrt) ? some(sqrt) : none();
 *         })
 *         .finish(({ bSquared, cSqrt }) => bSquared + cSqrt),
 *     none(),
 * );
 *
 * const result = computation.finish(({ a, b, c }) => a + b + c);
 * assertEquals(result, some(6));
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

export interface CatHkt extends Hkt1 {
    readonly type: Cat<this["arg1"]>;
}

/**
 * Contains a `value` and can be transformed into another one by `feed`.
 *
 * @typeParam T - Type of value, contained by `Cat`.
 */
export interface Cat<T> {
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
}
/**
 * Creates a new `Cat` contained `value`.
 *
 * @param value - A value will be contained.
 * @returns A new created `Cat`.
 *
 * # Examples
 *
 * ```ts
 * import { cat } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const result = cat(-3)
 *     .feed((x) => x ** 2)
 *     .feed((x) => x.toString());
 * assertEquals(result.value, "9");
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
export const partialEq = partialEqFromProjection<CatHkt>(get);
/**
 * Creates a `Eq` comparator for `Cat` from another existing one.
 */
export const eq = eqFromProjection<CatHkt>(get);
/**
 * Creates a `PartialOrd` comparator for `Cat` from another existing one.
 */
export const partialOrd = partialOrdFromProjection<CatHkt>(get);
/**
 * Creates a `Ord` comparator for `Cat` from another existing one.
 */
export const ord = ordFromProjection<CatHkt>(get);

/**
 * Inspects the passing value with an inspector. It is useful for using some side effects.
 *
 * @param inspector - An inspector to see the passing value.
 * @returns An identity function.
 *
 * # Examples
 *
 * ```ts
 * import { cat, inspect } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const result = cat(-3)
 *     .feed(inspect((x) => assertEquals(x, -3)))
 *     .feed((x) => x ** 2)
 *     .feed(inspect((x) => assertEquals(x, 9)))
 *     .feed((x) => x.toString())
 *     .feed(inspect((x) => assertEquals(x, "9")));
 * assertEquals(result.value, "9");
 * ```
 */
export const inspect = <T>(inspector: (t: T) => void) => (t: T) => {
    inspector(t);
    return t;
};

/**
 * An inspector which applied `console.log` to `inspect`.
 */
export const log = <T>(t: T) => inspect<T>(console.log)(t);
/**
 * An inspector which applied `console.debug` to `inspect`.
 */
export const debug = <T>(t: T) => inspect<T>(console.debug)(t);
/**
 * An inspector which applied `console.info` to `inspect`.
 */
export const info = <T>(t: T) => inspect<T>(console.info)(t);
/**
 * An inspector which applied `console.warn` to `inspect`.
 */
export const warn = <T>(t: T) => inspect<T>(console.warn)(t);
/**
 * An inspector which applied `console.error` to `inspect`.
 */
export const error = <T>(t: T) => inspect<T>(console.error)(t);
/**
 * An inspector which applied `console.dir` to `inspect`.
 */
export const dir = <T>(t: T) => inspect<T>(console.dir)(t);
/**
 * An inspector which applied `console.dirxml` to `inspect`.
 */
export const dirxml = <T>(t: T) => inspect<T>(console.dirxml)(t);
/**
 * An inspector which applied `console.table` to `inspect`.
 */
export const table = <T>(t: T) => inspect<T>(console.table)(t);

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
 * ```ts
 * import { cat, product } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const actual = product(cat(5))(cat("foo")).value;
 * assertEquals(actual, [5, "foo"]);
 * ```
 */
export const product = <A>(a: Cat<A>) => <B>(b: Cat<B>): Cat<[A, B]> =>
    cat([a.value, b.value]);

/**
 * Maps an inner value of a `Cat` into another one by applying a function. It is useful to lift a function for `Cat`.
 *
 * @param fn - A function which maps from `T` to `U`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * ```ts
 * import { cat, map } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const actual = map((v: number) => v / 2)(cat(10)).value;
 * assertEquals(actual, 5);
 * ```
 */
export const map = <T, U>(fn: (t: T) => U) => (c: Cat<T>): Cat<U> => c.feed(fn);

/**
 * Maps an inner value of `Cat` into another `Cat` by applying a function. It is useful to lift a subroutine with `Cat`.
 *
 * @param fn - A function which maps from `T` to `Cat<U>`.
 * @returns A lifted function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * ```ts
 * import { Cat, cat, flatMap } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const sub = (num: number): Cat<string> =>
 *     cat(num).feed((x) => x.toString());
 * const actual = flatMap(sub)(cat(6)).value;
 * assertEquals(actual, "6");
 * ```
 */
export const flatMap = <T, U>(fn: (t: T) => Cat<U>) => (c: Cat<T>): Cat<U> =>
    flatten(map(fn)(c));

/**
 * Lifts down a `Cat` which contains a mapping function. It is useful to decompose a function in `Cat`.
 *
 * @param fn - A `Cat` which contains a mapping function.
 * @returns An applied function which maps from `Cat<T>` to `Cat<U>`.
 *
 * # Examples
 *
 * ```ts
 * import { cat, apply } from "./cat.ts";
 * import { assertEquals } from "../deps.ts";
 *
 * const sub = cat((numeral: string) => parseInt(numeral, 10));
 * const actual = apply(sub)(cat("1024")).value;
 * assertEquals(actual, 1024);
 * ```
 */
export const apply =
    <T1, U1>(fn: Cat<(t: T1) => U1>) => (t: Cat<T1>): Cat<U1> =>
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
