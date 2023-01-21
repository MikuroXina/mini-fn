import { constant, flip, id } from "./func.js";

import type { Adjunction } from "./type-class/adjunction.js";
import type { Distributive } from "./type-class/distributive.js";
import type { Functor } from "./type-class/functor.js";
import type { Hkt1 } from "./hkt.js";
import type { Monad } from "./type-class/monad.js";
import type { Representable } from "./type-class/representable.js";
import type { Settable } from "./type-class/settable.js";
import type { Traversable } from "./type-class/traversable.js";

export { id };

export interface IdentityHkt extends Hkt1 {
    readonly type: this["arg1"];
}

export type Identity<T> = T;

export const run = id;

export const functor: Functor<IdentityHkt> = {
    map: id,
};

export const monad: Monad<IdentityHkt> = {
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

export const representable: Representable<IdentityHkt, []> = {
    ...functor,
    index: constant,
    tabulate: (f) => f([]),
};

export const adjunction: Adjunction<IdentityHkt, IdentityHkt, []> = {
    functor,
    representable,
    unit: id,
    counit: id,
};
