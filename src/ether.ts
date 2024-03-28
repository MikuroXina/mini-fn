import type { Get1, Hkt2, Hkt3 } from "./hkt.ts";
import type { Monad } from "./type-class/monad.ts";
import { IdentityHkt } from "./identity.ts";
import { doT } from "./cat.ts";

export type EtherSymbol<T> = symbol & {
    readonly etherValue: T;
};
export type EtherValue<S> = S extends EtherSymbol<infer T> ? T : never;

export const newEtherSymbol = <T>(): EtherSymbol<T> =>
    Symbol() as EtherSymbol<T>;

export type EtherDeps<D> = {
    [K in keyof D]: EtherValue<D[K]>;
};

export type OmitType<D, T> = {
    [K in keyof D as D[K] extends EtherSymbol<T> ? never : K]: D[K];
};

/**
 * EtherT is a function which needs dependencies `D` and returns `M<T>`.
 */
export interface EtherT<D, M, T> {
    readonly selfSymbol: EtherSymbol<T>;
    readonly handler: (resolved: EtherDeps<D>) => Get1<M, T>;
    readonly depSymbols: D;
}

export const runEtherT = <M, T>(
    ether: EtherT<Record<string, never>, M, T>,
): Get1<M, T> => ether.handler({});

export const newEtherT = <M>() =>
<
    T,
    const D extends Record<string, symbol> = Record<string, never>,
>(
    selfSymbol: EtherSymbol<T>,
    handler: (deps: EtherDeps<D>) => Get1<M, T>,
    depSymbols: D = {} as D,
): EtherT<D, M, T> => ({ selfSymbol, handler, depSymbols });

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

export const runEther = <T>(ether: Ether<Record<string, never>, T>): T =>
    ether.handler({});

export const newEther = <
    T,
    const D extends Record<string, symbol> = Record<string, never>,
>(
    selfSymbol: EtherSymbol<T>,
    handler: (deps: EtherDeps<D>) => T,
    depSymbols: D = {} as D,
): Ether<D, T> => ({ selfSymbol, handler, depSymbols });

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
