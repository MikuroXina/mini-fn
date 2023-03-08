import { compose, id } from "./func.js";
import type { Get1, Hkt1, Hkt3 } from "./hkt.js";
import type { Contravariant } from "./type-class/variance.js";

/**
 * Coyoneda functor, a dual of Yoneda functor reduction. It is also known as presheaf.
 */
export interface Coyoneda<F, B, A> {
    readonly hom: (a: A) => B;
    readonly map: Get1<F, B>;
}
/**
 * More generic construction form of `Coyoneda`, freeing type parameters.
 */
export interface CoyonedaConstructor<A> {
    <B>(hom: (a: A) => B): <F>(map: Get1<F, B>) => Coyoneda<F, B, A>;
}
/**
 * Creates the new constructor for `A`.
 *
 * @returns The Coyoneda constructor.
 */
export const coyoneda =
    <A>(): CoyonedaConstructor<A> =>
    <B>(hom: (a: A) => B) =>
    <F>(map: Get1<F, B>): Coyoneda<F, B, A> => ({
        hom,
        map,
    });

/**
 * Lifts the presheaf as a `Coyoneda`.
 *
 * @param fa - The presheaf to be expanded.
 * @returns The new expanded instance.
 */
export const lift = <F, A>(fa: Get1<F, A>): Coyoneda<F, A, A> => coyoneda<A>()(id)(fa);

/**
 * Lowers `coy` on a presheaf.
 *
 * @param contra - The instance of `Contravariant` for `F`.
 * @param coy - The instance to be reduced.
 * @returns The reduction on a presheaf.
 */
export const lower =
    <F extends Hkt1>(contra: Contravariant<F>) =>
    <B, A>(coy: Coyoneda<F, B, A>): Get1<F, A> =>
        contra.contraMap(coy.hom)(coy.map);

/**
 * Lifts the natural transformation from `F` to `G` on `Coyoneda`.
 *
 * @param nat - The natural transformation to be lifted.
 * @returns The lifted transformation.
 */
export const hoist =
    <F, G>(nat: <A>(fa: Get1<F, A>) => Get1<G, A>) =>
    <B, A>(coy: Coyoneda<F, B, A>): Coyoneda<G, B, A> =>
        coyoneda<A>()(coy.hom)(nat(coy.map));

/**
 * Maps the function into an opposite function on `Coyoneda`.
 *
 * @param fn - The function from `T` to `U`.
 * @returns The mapped function.
 */
export const contraMap =
    <T, U>(fn: (t: T) => U) =>
    <F, B>(coy: Coyoneda<F, B, U>): Coyoneda<F, B, T> => {
        const { hom, map } = coy;
        return { hom: compose(hom)(fn), map };
    };

export interface CoyonedaHkt extends Hkt3 {
    readonly type: Coyoneda<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Contravariant` for `Coyoneda`.
 */
export const contravariant: Contravariant<CoyonedaHkt> = { contraMap };
