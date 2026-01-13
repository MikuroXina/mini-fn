import { absurd, constant } from "./func.js";
import type { Apply2Only, Apply3Only, Get1, Hkt2, Hkt3 } from "./hkt.js";
import * as Identity from "./identity.js";
import type { MonadPromise } from "./promise/monad.js";
import type { Monad } from "./type-class/monad.js";

/**
 * Monad transformer `ContT`, the generic form of `Cont`.
 */
export type ContT<R, M, A> = (callback: (a: A) => Get1<M, R>) => Get1<M, R>;

/**
 * Runs the computation with a given final computation.
 *
 * @param contT - The computation.
 * @returns The running result.
 */
export const runContT: <R, M, A>(
    contT: ContT<R, M, A>,
) => (callback: (a: A) => Get1<M, R>) => Get1<M, R> = Identity.id;
/**
 * Evaluates the computation with the identity from `R` to `R`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param contT - The computation.
 * @returns The final continuation.
 */
export const evalContT =
    <M>(monad: Monad<M>) =>
    <R>(contT: ContT<R, M, R>): Get1<M, R> =>
        contT(monad.pure);
/**
 * Applies the function to transform the result of a continuation passing computation. This has more stronger typing because `ContT` does not require that `M` has the instance of `Monad`.
 *
 * @param mapper - The function to be lifted.
 * @param contT - The computation.
 * @returns The lifted function between `ContT`.
 */
export const mapContT =
    <M, R>(mapper: (mr: Get1<M, R>) => Get1<M, R>) =>
    <A>(contT: ContT<R, M, A>): ContT<R, M, A> =>
    (fn) =>
        contT((a) => mapper(fn(a)));
/**
 * Applies the function to transform the continuation passed to the computation.
 *
 * @param callback - The function to be applied.
 * @param contT - The computation.
 * @returns The transformed `ContT`.
 */
export const withContT =
    <M, A, B, R>(
        callback: (fn: (b: B) => Get1<M, R>) => (a: A) => Get1<M, R>,
    ) =>
    (contT: ContT<R, M, A>): ContT<R, M, B> =>
    (fn) =>
        contT(callback(fn));

/**
 * Calls `computation` with the current continuation. This provides an escape continuation mechanism for use with continuation monads. Escape continuation `exit` can abort the current computation and return a value immediately, like non local exits or exception. The advantage of using this over calling `pure` is that makes the continuation explicit, allowing more flexibility and better control.
 *
 * The standard idiom used with `callCC` is to provide a lambda expression to name the continuation as a label. Then calling the label anywhere within its scope will escape from the computation, even if it is many layers deep within nested computations.
 *
 * @param computation - The computation will be provided `exit`.
 * @returns The label trigger to abort.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const validateName =
 *     (name: string) =>
 *     (exit: (a: string) => Cont<string, never[]>): Cont<string, never[]> =>
 *         when(name.length === 0)<string>(exit("expected at least 1 character"));
 * const whatYourName = (name: string): string => {
 *     const cont = callCC<string, IdentityHkt, string, never[]>(
 *         (exit) =>
 *             cat(validateName(name)(exit)).feed(
 *                 flatMap<string, IdentityHkt, never[], string>(() => pure<string, string>(`Welcome, ${name}!`)),
 *             ).value,
 *     );
 *     return runCont(cont)(id);
 * };
 * expect(whatYourName("Alice")).toStrictEqual("Welcome, Alice!");
 * expect(whatYourName("")).toStrictEqual("expected at least 1 character");
 * ```
 */
export const callCC =
    <R, M, A, B>(
        computation: (exit: (a: A) => ContT<R, M, B>) => ContT<R, M, A>,
    ): ContT<R, M, A> =>
    (c): Get1<M, R> =>
        computation(
            (a): ContT<R, M, B> =>
                (_fn): Get1<M, R> =>
                    c(a),
        )(c);

/**
 * Delimits the continuation of any `shiftT` inside `M`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param contT - The limited continuation.
 * @returns The delimited continuation.
 */
export const resetT =
    <M>(monad: Monad<M>) =>
    <R, S>(contT: ContT<R, M, R>): ContT<S, M, R> =>
    (c) =>
        monad.flatMap(c)(evalContT(monad)(contT));
/**
 * Captures the continuation up to the nearest enclosing `resetT`, and passes it to `computation`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param computation - The computation will be provided `exit`.
 * @returns The limited continuation.
 */
export const shiftT =
    <M>(monad: Monad<M>) =>
    <R, A>(
        computation: (exit: (a: A) => Get1<M, R>) => ContT<R, M, R>,
    ): ContT<R, M, A> =>
    (fn) =>
        evalContT(monad)(computation(fn));

/**
 * Yields the function `local` for `Cont<R, M, _>`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param ask - The instance of `S` wrapped by `M`.
 * @param cleanup - The cleanup function to be yielded.
 * @param local - The local computation to be lifted.
 * @param src - The computation of source.
 * @returns The lifted computation.
 */
export const liftLocal =
    <M>(monad: Monad<M>) =>
    <S>(ask: Get1<M, S>) =>
    <R>(cleanup: (callback: (s: S) => S) => (mr: Get1<M, R>) => Get1<M, R>) =>
    (local: (s: S) => S) =>
    <A>(src: ContT<R, M, A>): ContT<R, M, A> =>
    (c) =>
        monad.flatMap((r: S) =>
            cleanup(local)(src((x) => cleanup(constant(r))(c(x)))),
        )(ask);

/**
 * Continuation monad which expresses a CPS (continuation passing style) computation, produces an intermediate result of type a within the computation whose final result type is `R`.
 */
export type Cont<R, A> = ContT<R, Identity.IdentityHkt, A>;

/**
 * Runs the computation with a given final computation.
 *
 * @param cont - The computation.
 * @returns The running result.
 */
export const runCont = <R, A>(cont: Cont<R, A>): ((fn: (a: A) => R) => R) =>
    runContT<R, Identity.IdentityHkt, A>(cont);
/**
 * Runs the computation with the identity from `R` to `R`.
 *
 * @param cont - The computation.
 * @returns The running result.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const actual = evalCont<number>(pure(42));
 * expect(actual).toStrictEqual(42);
 * ```
 */
export const evalCont: <R>(cont: Cont<R, R>) => R = evalContT(Identity.monad);

/**
 * Applies the function to transform the result of the computation.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const actual = evalCont(mapCont((x: number) => x + 1)(pure(42)));
 * expect(actual).toStrictEqual(43);
 * ```
 */
export const mapCont = <R>(
    mapper: (r: R) => R,
): (<A>(cont: Cont<R, A>) => Cont<R, A>) =>
    mapContT<Identity.IdentityHkt, R>(mapper);

/**
 * Applies the function to transform the continuation passed to the computation.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * const cont = withCont((fn: (x: number) => boolean) => (a: string) =>
 *     fn(parseInt(a, 10))
 * )(
 *     (callback) => callback("foo"),
 * );
 * const actual = runCont(cont)(Number.isNaN);
 * expect(actual).toStrictEqual(true);
 * ```
 */
export const withCont = <A, B, R>(
    callback: (fn: (b: B) => R) => (a: A) => R,
): ((cont: Cont<R, A>) => Cont<R, B>) =>
    withContT<Identity.IdentityHkt, A, B, R>(callback);

/**
 * Delimits the continuation of any `shift` inside `M`.
 *
 * @param contT - The limited continuation.
 * @returns The delimited continuation.
 */
export const reset: <R, S>(contT: Cont<R, R>) => Cont<S, R> = resetT(
    Identity.monad,
);
/**
 * Captures the continuation up to the nearest enclosing `reset`, and passes it to `computation`.
 *
 * @param computation - The computation will be provided `exit`.
 * @returns The limited continuation.
 */
export const shift: <R, A>(
    computation: (exit: (a: A) => R) => Cont<R, R>,
) => Cont<R, A> = shiftT(Identity.monad);

/**
 * Wraps the value with `ContT`.
 *
 * @param a - The value to be wrapped.
 * @returns The new computation.
 */
export const pureT =
    <R, M, A>(a: A): ContT<R, M, A> =>
    (fn) =>
        fn(a);

/**
 * Wraps the value with `Cont`.
 *
 * @param a - The value to be wrapped.
 * @returns The new computation.
 */
export const pure = <R, A>(a: A): Cont<R, A> =>
    pureT<R, Identity.IdentityHkt, A>(a);
/**
 * Maps the continuation with `mapper`.
 *
 * @param mapper - The function to be mapped.
 * @returns The mapped function for `ContT`.
 */
export const map =
    <A, B>(mapper: (a: A) => B) =>
    <R, M>(cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        cont((a) => c(mapper(a)));
/**
 * Maps and flattens the continuation with `mapper`.
 *
 * @param mapper - The function to be mapped.
 * @returns The mapped function for `ContT`.
 */
export const flatMap =
    <R, M, A, B>(mapper: (a: A) => ContT<R, M, B>) =>
    (cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        cont((a) => mapper(a)(c));
/**
 * Applies `app` function while wrapped by `ContT`.
 *
 * @param app - The function contained by `ContT`.
 * @returns The applied computation.
 */
export const apply =
    <R, M, A, B>(app: ContT<R, M, (a: A) => B>) =>
    (cont: ContT<R, M, A>): ContT<R, M, B> =>
    (c) =>
        app((g) => cont((a) => c(g(a))));
/**
 * Make a product of two `ContT`s.
 *
 * @param ca - The first `ContT`.
 * @param cb - The second `ContT`.
 * @returns The product of `ca` and `cb`.
 */
export const product =
    <R, M, A>(ca: ContT<R, M, A>) =>
    <B>(cb: ContT<R, M, B>): ContT<R, M, [A, B]> =>
    (c) =>
        ca((a) => cb((b) => c([a, b])));

/**
 * Lifts the instance of `M` with `Monad`.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param m - The instance of `M`.
 * @returns The computation wraps `m`.
 */
export const lift =
    <M>(monad: Monad<M>) =>
    <R, A>(m: Get1<M, A>): ContT<R, M, A> =>
    (mapper) =>
        monad.flatMap(mapper)(m);

/**
 * Lifts the asynchronous computation into the continuation passing style.
 *
 * @param monad - The instance of `MonadPromise` for `M`.
 * @param p - The asynchronous computation.
 * @returns The computation wraps `p`.
 */
export const liftPromise =
    <M>(monad: MonadPromise<M>) =>
    <R, A>(p: Promise<A>): ContT<R, M, A> =>
        lift(monad)(monad.liftPromise(p));

/**
 * Provides a branch statement for `Cont`. `cont` will be evaluated if `cond` is `true`, otherwise it will be an empty computation.
 *
 * @param cond - The condition as branch statement.
 * @param cont - The computation evaluated if `cond` is `true`.
 * @returns The composed computation.
 */
export const when =
    (cond: boolean) =>
    <R, M = Identity.IdentityHkt>(
        cont: ContT<R, M, never[]>,
    ): ContT<R, M, never[]> =>
        cond ? cont : pure([]);
/**
 * Provides a branch statement for `Cont`. `cont` will be evaluated if `cond` is `false`, otherwise it will be an empty computation.
 *
 * @param cond - The condition as branch statement.
 * @param cont - The computation evaluated if `cond` is `false`.
 * @returns The composed computation.
 */
export const unless =
    (cond: boolean) =>
    <R, M>(cont: ContT<R, M, never[]>): ContT<R, M, never[]> =>
        cond ? pure([]) : cont;
/**
 * Provides an assertion statement for `Cont`. It will returns an empty computation if `cond` is true, otherwise it will occur an exception.
 *
 * @param cond - The condition as branch statement.
 * @returns The assertion computation.
 */
export const guard = <R>(cond: boolean): Cont<R, never[]> =>
    cond ? pure([]) : absurd;

export interface ContHkt extends Hkt2 {
    readonly type: Cont<this["arg2"], this["arg1"]>;
}

export interface ContTHkt extends Hkt3 {
    readonly type: ContT<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Monad` for `ContT<R, M, _>`.
 */
export const monad = <R, M = Identity.IdentityHkt>(): Monad<
    Apply3Only<ContTHkt, R> & Apply2Only<ContTHkt, M>
> => ({
    pure,
    map,
    flatMap,
    apply,
});
