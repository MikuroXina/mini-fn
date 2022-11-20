import { flip, id } from "./func";

import type { Monad1 } from "./type-class/monad";
import type { Traversable1 } from "./type-class/traversable";
import { make } from "./tuple";

export { id };

declare const identityNominal: unique symbol;
export type IdentityHktKey = typeof identityNominal;

export type Identity<T> = T;

export const run = id;

declare module "./hkt" {
    interface HktDictA1<A1> {
        [identityNominal]: Identity<A1>;
    }
}

export const monad: Monad1<IdentityHktKey> = {
    product: make,
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
