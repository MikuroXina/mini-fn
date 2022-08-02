import type { Monad1 } from "./type-class/monad";

declare const identityNominal: unique symbol;
export type IdentityHktKey = typeof identityNominal;

export type Identity<T> = T;

export const run = <T>(i: Identity<T>) => i;
export const id = run;

declare module "./hkt" {
    interface HktDictA1<A1> {
        [identityNominal]: Identity<A1>;
    }
}

export const monad: Monad1<IdentityHktKey> = {
    pure: id,
    map: id,
    flatMap: id,
    apply: id,
};
