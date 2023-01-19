import type { Get1, Hkt1, Hkt3 } from "./hkt.js";
import { compose, id } from "./func.js";

import type { Contravariant } from "./type-class/variance.js";

export interface Coyoneda<F, B, A> {
    readonly hom: (a: A) => B;
    readonly map: Get1<F, B>;
}
export interface CoyonedaConstructor<A> {
    <B>(hom: (a: A) => B): <F>(map: Get1<F, B>) => Coyoneda<F, B, A>;
}
export const coyoneda =
    <A>(): CoyonedaConstructor<A> =>
    <B>(hom: (a: A) => B) =>
    <F>(map: Get1<F, B>): Coyoneda<F, B, A> => ({
        hom,
        map,
    });

export const lift = <F, A>(fa: Get1<F, A>): Coyoneda<F, A, A> => coyoneda<A>()(id)(fa);

export const lower =
    <F extends Hkt1>(contra: Contravariant<F>) =>
    <B, A>(coy: Coyoneda<F, B, A>): Get1<F, A> =>
        contra.contraMap(coy.hom)(coy.map);

export const hoist =
    <F, G>(nat: <A>(fa: Get1<F, A>) => Get1<G, A>) =>
    <B, A>(coy: Coyoneda<F, B, A>): Coyoneda<G, B, A> =>
        coyoneda<A>()(coy.hom)(nat(coy.map));

export const contraMap =
    <T, U>(fn: (t: T) => U) =>
    <F, B>(coy: Coyoneda<F, B, U>): Coyoneda<F, B, T> => {
        const { hom, map } = coy;
        return { hom: compose(hom)(fn), map };
    };

export interface CoyonedaHkt extends Hkt3 {
    readonly type: Coyoneda<this["arg3"], this["arg2"], this["arg1"]>;
}

export const contravariant: Contravariant<CoyonedaHkt> = { contraMap };
