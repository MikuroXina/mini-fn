import { flip, id } from "./func.ts";
import type { Hkt1 } from "./hkt.ts";
import type { Applicative } from "./type-class/applicative.ts";
import type { Comonad } from "./type-class/comonad.ts";
import type { Distributive } from "./type-class/distributive.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { PartialEqUnary } from "./type-class/partial-eq.ts";
import type { Settable } from "./type-class/settable.ts";
import type { Traversable } from "./type-class/traversable.ts";

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
 * The `Applicative` instance for `Identity`.
 */
export const applicative: Applicative<IdentityHkt> = {
    pure: id,
    map: id,
    apply: id,
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
 * The `PartialEqUnary` instance for `Identity`.
 */
export const partialEqUnary: PartialEqUnary<IdentityHkt> = { liftEq: id };
