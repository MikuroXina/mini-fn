import { flip, id } from "./func.js";

import type { Distributive } from "./type-class/distributive.js";
import type { Hkt1 } from "./hkt.js";
import type { Monad } from "./type-class/monad.js";
import type { Settable } from "./type-class/settable.js";
import type { Traversable } from "./type-class/traversable.js";
import { make } from "./tuple.js";

export { id };

export interface IdentityHkt extends Hkt1 {
    readonly type: this["arg1"];
}

export type Identity<T> = T;

export const run = id;

export const monad: Monad<IdentityHkt> = {
    product: make,
    pure: id,
    map: id,
    flatMap: id,
    apply: id,
};

export const traversable: Traversable<IdentityHkt> = {
    map: id,
    foldR: flip,
    traverse: () => id,
};

export const distributive: Distributive<IdentityHkt> = {
    map: id,
    distribute: () => id,
};

export const settable: Settable<IdentityHkt> = {
    ...traversable,
    ...monad,
    ...distributive,
    untainted: id,
};
