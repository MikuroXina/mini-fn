import type { Monad1 } from "./type-class/monad";
import type { Traversable1 } from "./type-class/traversable";
import { Tuple } from "./lib";
import { flip } from "./func";

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
    product: Tuple.make,
    pure: id,
    map: id,
    flatMap: id,
    apply: id,
};

export const traversable: Traversable1<IdentityHktKey> = {
    map: id,
    foldR: flip,
    traverse: () => id,
};
