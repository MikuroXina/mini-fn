/**
 * This package provides a dependency container combinator `EtherT`/`Ether` and associated functions.
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
        return {
            selfSymbol: upper.selfSymbol,
            handler: (deps) =>
                doT(monad).addM("resolved", lower.handler(deps))
                    .addMWith("ret", ({ resolved }) => {
                        const depsForUpper: Record<string, unknown> = {
                            ...deps,
                        };
                        for (const targetKey of targetKeys) {
                            depsForUpper[targetKey] = resolved;
                        }
                        return upper.handler(depsForUpper as EtherDeps<E>);
                    }).finish(({ ret }) => ret),
            depSymbols: Object.fromEntries(
                Object.entries({ ...upper.depSymbols, ...lower.depSymbols })
                    .filter(
                        ([, depSym]) => depSym === lower.selfSymbol,
                    ),
            ) as OmitType<E, T> & D,
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
        return {
            selfSymbol: upper.selfSymbol,
            handler: (deps) => {
                const resolved = lower.handler(deps);
                const depsForUpper: Record<string, unknown> = { ...deps };
                for (const targetKey of targetKeys) {
                    depsForUpper[targetKey] = resolved;
                }
                return upper.handler(depsForUpper as EtherDeps<E>);
            },
            depSymbols: Object.fromEntries(
                Object.entries({ ...upper.depSymbols, ...lower.depSymbols })
                    .filter(
                        ([, depSym]) => depSym === lower.selfSymbol,
                    ),
            ) as OmitType<E, T> & D,
        };
    };

export interface EtherHkt extends Hkt2 {
    readonly type: Ether<this["arg2"], this["arg1"]>;
}
