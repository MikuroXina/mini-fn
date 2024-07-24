/**
 * This package provides a dependency container combinator `EtherT`/`Ether` and associated functions.
 *
 * # Guide
 *
 * This aims resolving dependencies and notifying lacks by type errors, by representing dependencies required by an object or a function to work as typing.
 *
 * ## Symbol association and type information
 *
 * On `Ether`'s system, at first creates a tag used by `Ether` (a `Symbol` with some type info actually) with invoking `Ether.newEtherSymbol` with a type parameter of your type definition (mostly your `interface`s). In this way, let's make symbols for each abstract such as database persistence, randomized value generator, communication, and decision meditator. Even type parameters are same, they are treated as different if unequal symbols.
 *
 * For instance, representing two "Repository which persists articles `ArticleRepository`" and "Request handler which decides and registers `(req: Req) => Promise<void>`" will be the following code:
 *
 * ```ts
 * import { Ether } from "@mikuroxina/mini-fn";
 *
 * export type Article = {
 *   createdAt: string;
 *   updatedAt: string;
 *   body: string;
 * };
 *
 * export interface ArticleRepository {
 *   has: (id: string) => Promise<boolean>;
 *   insert: (id: string, article: Partial<Article>) => Promise<void>;
 * }
 * export const repoSymbol = Ether.newEtherSymbol<ArticleRepository>();
 *
 * export type Req = {
 *   id: string;
 *   timestamp: string;
 *   body: string;
 * };
 * export const serviceSymbol = Ether.newEtherSymbol<(req: Req) => Promise<void>>();
 * ```
 *
 * ## Dependencies definition and receiving other dependencies over
 *
 * For the symbols defined above, let's make the actual instances satisfying requirements usable on `Ether`'s system. You can do this by calling `newEther` function. For a symbol, you can define any objects `Ether<D, T>` satisfying the underlying type `T`.
 *
 * At the first parameter, you pass the symbol to associate. And at the second parameter, you pass the function to make an object satisfying the requirement `T`. This function will provide objects depended by others.
 *
 * At the optional third parameter, you specify the dependencies with name as key and value as the symbol corresponding to its type. In the function that you passed at the second parameter, the resolved dependencies which specified at the third parameter will be passed.
 *
 * ```ts
 * import { Ether } from "@mikuroxina/mini-fn";
 *
 * export const mockRepository = Ether.newEther(
 *   repoSymbol,
 *   () => ({
 *     has: (id) => Promise.resolve(true),
 *     insert: (id, article) => Promise.resolve(),
 *   }),
 * );
 *
 * export const service = Ether.newEther(
 *   serviceSymbol,
 *   ({ repo }) => async ({ id, timestamp, body }: Req) => {
 *     if (!await repo.has(id)) {
 *       return;
 *     }
 *     await repo.insert(id, { updatedAt: timestamp, body });
 *     return;
 *   },
 *   { repo: repoSymbol },
 * );
 * ```
 *
 * ## Dependency injection process and condition to work
 *
 * `Ether` expresses the needed dependencies as type information. The `Ether<D, T>` type means that it can construct an object of type `T` by using dependencies `D` (key-value type of each variable name and symbol).
 *
 * Using `Ether.compose` function, you can inject an `Ether` into another `Ether`. If it is a required dependency actually, `D` of injected will be reduced only the entry corresponding to the symbol of injecting.
 *
 * ```ts
 * import { Cat, Ether } from "@mikuroxina/mini-fn";
 *
 * // Ether.compose( injecting )( to be injected ) -> injected Ether
 * const injected = Ether.compose(mockRepository)(service);
 *
 * // `Cat` is useful to inject multiple dependencies.
 * const multiInjected = Cat.cat(service)
 *   .feed(Ether.compose(mockRepository))
 *   .feed(Ether.compose(otherService))
 *   .feed(Ether.compose(xorShiftRng))
 *   .value;
 * ```
 *
 * Only no dependencies required, you can get the object of type `T` by `Ether.runEther` function. When dependencies became empty applying `compose`, `D` will be equivalent to `Record<string, never>` and you can use `Ether.runEther`. Conversely, if the dependencies are not enough, it will occurs type errors and shows the variable name of lacking dependency.
 *
 * ```ts
 * // It will occur type errors if the dependencies not enough.
 * const resolved = Ether.runEther(multiInjected);
 * ```
 *
 * However, you can't represent the circular dependencies with `Ether` because it occurs an infinite recursion.
 *
 * # Conclusion
 *
 * You can use `Ether`'s system as the following steps.
 *
 * 1. For each your type, create a corresponding symbol with `newEtherSymbol`.
 * 2. Construct `Ether` objects corresponding the symbol types with `newEther`.
 * 3. Inject other `Ether`s into an `Ether` with `compose`. `Cat` is useful to do it.
 * 4. Get the injected value by `runEther`, or fix type errors about dependencies.
 *
 * # `EtherT` for dependencies over a monad such as `Promise`
 *
 * If `Ether` is all, the dependency which can be built only in `Promise` such as cryptography module doesn't work well. If the built object is wrapped in a `Promise`, extracting it is so annoying.
 *
 * In the situation, `EtherT<D, M, T>` which is the monad transformer version of `Ether<D, T>` helps you. This allows you to handle dependencies wrapped in a monad without notice of wrapped in, by the monad power.
 *
 * For example, describing the case building over `Promise`. Usage of `newEtherT` and `runEtherT` function is same as the functions for `Ether`.
 *
 * ```ts
 * import { Ether, Promise } from "@mikuroxina/mini-fn";
 *
 * export const authenticateTokenSymbol =
 *   Ether.newEtherSymbol<AuthenticationTokenService>();
 * export const authenticateToken = Ether.newEtherT<Promise.PromiseHkt>()(
 *   authenticateTokenSymbol,
 *   AuthenticationTokenService.new,
 * );
 * ```
 *
 * Only `composeT` injecting an dependency, it is modified to require the monad instance as a parameter. When injecting dependencies over `Promise`, you will pass the monad instance of `Promise`. And mixing the normal `Ether` and `EtherT`, you need to convert `Ether`s into `EtherT`s of same monad environment `M` with `liftEther`.
 *
 * ```ts
 * import { Cat, Ether, Promise } from "@mikuroxina/mini-fn";
 *
 * const composer = Ether.composeT(Promise.monad);
 * const liftOverPromise = Ether.liftEther(Promise.monad);
 *
 * const authenticateService = await Ether.runEtherT(
 *   Cat.cat(liftOverPromise(authenticate))
 *     .feed(composer(liftOverPromise(accountRepository)))
 *     .feed(composer(authenticateToken))
 *     .feed(composer(liftOverPromise(argon2idPasswordEncoder))).value,
 * );
 * ```
 *
 * @packageDocumentation
 * @module
 */

import type { Get1, Hkt2, Hkt3 } from "./hkt.ts";
import type { Monad } from "./type-class/monad.ts";
import type { IdentityHkt } from "./identity.ts";
import { doT } from "./cat.ts";

/**
 * A symbol among Ether values, which resolves into the actual producing type.
 */
export type EtherSymbol<T> = symbol & {
    readonly etherValue: T;
};
/**
 * Gets the value type from an `EtherSymbol`.
 */
export type EtherValue<S> = S extends EtherSymbol<infer T> ? T : never;

/**
 * Makes a new `EtherSymbol` for `newEther` or `newEtherT`. It should be created with an interface definition.
 *
 * @returns The unique `EtherSymbol`.
 */
export const newEtherSymbol = <T>(): EtherSymbol<T> =>
    Symbol() as EtherSymbol<T>;

/**
 * A dependencies object which will be passed to `Ether`'s handler.
 */
export type EtherDeps<D> = {
    [K in keyof D]: EtherValue<D[K]>;
};

/**
 * Omits fields of type `T` from a dependencies object type `D`.
 */
export type OmitType<D, T> = {
    [K in keyof D as D[K] extends EtherSymbol<T> ? never : K]: D[K];
};

/**
 * EtherT is a function which needs dependencies `D` and returns `M<T>`.
 */
export type EtherT<D, M, T> = {
    readonly selfSymbol: EtherSymbol<T>;
    readonly handler: (resolved: EtherDeps<D>) => Get1<M, T>;
    readonly depSymbols: D;
};

/**
 * Executes an `EtherT` which requires no dependencies.
 *
 * @param ether Execution target.
 * @returns The return value of `ether`'s handler.
 */
export const runEtherT = <M, T>(
    ether: EtherT<Record<string, never>, M, T>,
): Get1<M, T> => ether.handler({});

/**
 * Creates a new `EtherT`.
 *
 * @param selfSymbol The unique symbol corresponding to the return type `T`.
 * @param handler The function which creates an object of type `T` from the dependencies object on `M`.
 * @param depSymbols The declaration of symbols by key, for `handler` which requires dependencies.
 * @returns A new `EtherT` having parameters as fields.
 */
export const newEtherT = <M>() =>
<
    T,
    const D extends Record<string, symbol> = Record<string, never>,
>(
    selfSymbol: EtherSymbol<T>,
    handler: (deps: EtherDeps<D>) => Get1<M, T>,
    depSymbols: D = {} as D,
): EtherT<D, M, T> => ({ selfSymbol, handler, depSymbols });

/**
 * Composes two `EtherT`s into a new one. Injects `lower` into `upper`.
 *
 * @param monad The monad implementation for `M`.
 * @param lower The lower dependency, which will be injected, such as a database adaptor.
 * @param upper The upper dependency, which will injected `lower`, such as a service function.
 * @returns The injected `EtherT`, which will be resolved the matching dependencies on `upper` with `lower`'s handler.
 */
export const composeT =
    <M>(monad: Monad<M>) =>
    <const D extends Record<string, symbol>, T>(lower: EtherT<D, M, T>) =>
    <const E extends Record<string, symbol>, U>(
        upper: EtherT<E, M, U>,
    ): EtherT<OmitType<E, T> & D, M, U> => {
        const targetKeys = Object.entries(upper.depSymbols).filter(([, sym]) =>
            sym === lower.selfSymbol
        ).map(([key]) => key);
        const composedHandler = (deps: EtherDeps<OmitType<E, T> & D>) =>
            doT(monad).addM("resolved", lower.handler(deps))
                .addMWith("ret", ({ resolved }) => {
                    const depsForUpper: Record<string, unknown> = {
                        ...deps,
                    };
                    for (const targetKey of targetKeys) {
                        depsForUpper[targetKey] = resolved;
                    }
                    return upper.handler(depsForUpper as EtherDeps<E>);
                }).finish(({ ret }) => ret);
        const symbolsDeletedSelf = Object.fromEntries(
            Object.entries({ ...upper.depSymbols, ...lower.depSymbols })
                .filter(
                    ([, depSym]) => depSym !== lower.selfSymbol,
                ),
        );
        return {
            selfSymbol: upper.selfSymbol,
            handler: composedHandler,
            depSymbols: symbolsDeletedSelf as OmitType<E, T> & D,
        };
    };

export interface EtherTHkt extends Hkt3 {
    readonly type: EtherT<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * Ether is a function which needs dependencies `D` and returns `M<T>`.
 */
export type Ether<D, T> = EtherT<D, IdentityHkt, T>;

/**
 * Executes an `Ether` which requires no dependencies.
 *
 * @param ether Execution target.
 * @returns The return value of `ether`'s handler.
 */
export const runEther = <T>(ether: Ether<Record<string, never>, T>): T =>
    ether.handler({});

/**
 * Creates a new `Ether`.
 *
 * @param selfSymbol The unique symbol corresponding to the return type `T`.
 * @param handler The function which creates an object of type `T` from the dependencies object.
 * @param depSymbols The declaration of symbols by key, for `handler` which requires dependencies.
 * @returns A new `Ether` having parameters as fields.
 */
export const newEther = <
    T,
    const D extends Record<string, symbol> = Record<string, never>,
>(
    selfSymbol: EtherSymbol<T>,
    handler: (deps: EtherDeps<D>) => T,
    depSymbols: D = {} as D,
): Ether<D, T> => ({ selfSymbol, handler, depSymbols });

/**
 * Lifts up an `Ether` over the monad `M`.
 *
 * @param monad - The `Monad` instance for `M`.
 * @param ether - An `Ether` to lift over `M`.
 * @returns The lifted `Ether`.
 */
export const liftEther =
    <M>(monad: Monad<M>) =>
    <const D extends Record<string, symbol>, T>(
        ether: Ether<D, T>,
    ): EtherT<D, M, T> => ({
        ...ether,
        handler: (resolved) => monad.pure(ether.handler(resolved)),
    });

/**
 * Composes two `Ether`s into a new one. Injects `lower` into `upper`.
 *
 * @param lower The lower dependency, which will be injected, such as a database adaptor.
 * @param upper The upper dependency, which will injected `lower`, such as a service function.
 * @returns The injected `Ether`, which will be resolved the matching dependencies on `upper` with `lower`'s handler.
 */
export const compose =
    <const D extends Record<string, symbol>, T>(lower: Ether<D, T>) =>
    <const E extends Record<string, symbol>, U>(
        upper: Ether<E, U>,
    ): Ether<OmitType<E, T> & D, U> => {
        const targetKeys = Object.entries(upper.depSymbols).filter(([, sym]) =>
            sym === lower.selfSymbol
        ).map(([key]) => key);
        const composedHandler = (deps: EtherDeps<OmitType<E, T> & D>) => {
            const resolved = lower.handler(deps);
            const depsForUpper: Record<string, unknown> = { ...deps };
            for (const targetKey of targetKeys) {
                depsForUpper[targetKey] = resolved;
            }
            return upper.handler(depsForUpper as EtherDeps<E>);
        };
        const symbolsDeletedSelf = Object.fromEntries(
            Object.entries({ ...upper.depSymbols, ...lower.depSymbols })
                .filter(
                    ([, depSym]) => depSym !== lower.selfSymbol,
                ),
        );
        return {
            selfSymbol: upper.selfSymbol,
            handler: composedHandler,
            depSymbols: symbolsDeletedSelf as OmitType<E, T> & D,
        };
    };

export interface EtherHkt extends Hkt2 {
    readonly type: Ether<this["arg2"], this["arg1"]>;
}
