import { constant, flip, id } from "./func.js";
import type { Hkt1 } from "./hkt.js";
import type { Adjunction } from "./type-class/adjunction.js";
import type { Comonad } from "./type-class/comonad.js";
import type { Distributive } from "./type-class/distributive.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { ApplyRep, Representable } from "./type-class/representable.js";
import type { Settable } from "./type-class/settable.js";
import type { Traversable } from "./type-class/traversable.js";

export { id };

export interface IdentityHkt extends Hkt1 {
    readonly type: this["arg1"];
}

/**
 * The identity functor which is same as the type parameter.
 */
export type Identity<T> = T;

/**
 * Gets the value of `Identity`. It is same as the identity function.
 */
export const run = id;

/**
 * The instance of `Functor` for `Identity`.
 */
export const functor: Functor<IdentityHkt> = {
    map: id,
};

/**
 * The instance of `Monad` for `Identity`.
 */
export const monad: Monad<IdentityHkt> = {
    pure: id,
    map: id,
    flatMap: id,
    apply: id,
};

/**
 * The instance of `Comonad` for `Identity`.
 */
export const comonad: Comonad<IdentityHkt> = {
    map: id,
    extract: id,
    duplicate: id,
};

/**
 * The instance of `Traversable` for `Identity`.
 */
export const traversable: Traversable<IdentityHkt> = {
    map: id,
    foldR: flip,
    traverse: () => id,
};

/**
 * The instance of `Functor` for `Identity`.
 */
export const distributive: Distributive<IdentityHkt> = {
    map: id,
    distribute: () => id,
};

/**
 * The instance of `Settable` for `Identity`.
 */
export const settable: Settable<IdentityHkt> = {
    ...traversable,
    ...monad,
    ...distributive,
    untainted: id,
};

/**
 * The instance of `Representable` for `Identity` with `[]` representation.
 */
export const representable: Representable<ApplyRep<IdentityHkt, []>> = {
    ...functor,
    index: constant,
    tabulate: (f) => f([]),
};

/**
 * The instance of `Adjunction` for `Identity` against to itself with `[]` representation..
 */
export const adjunction: Adjunction<IdentityHkt, ApplyRep<IdentityHkt, []>> = {
    functor,
    representable,
    unit: id,
    counit: id,
};
