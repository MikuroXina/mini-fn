import type { Get1, Get2, Hkt0, Hkt1 } from "../hkt.ts";
import type { Functor } from "./functor.ts";
import type { Profunctor } from "./profunctor.ts";

/**
 * An HKT extension to provide associated type `Corep` for `Corepresentable`.
 */
export interface HktCorep {
    readonly corep: Hkt1; // Representation type
}

export type ApplyCorep<P, H> = P extends Hkt0 ? P & { readonly corep: H }
    : never;
export type Corep<P> = P extends HktCorep ? P["corep"] : never;
export type GetCorep<P, T> = Get1<Corep<P>, T>;

export type Corepresentable<P> = Profunctor<P> & {
    readonly functor: Functor<Corep<P>>;
    readonly coindex: <A, B>(
        pab: Get2<P, A, B>,
    ) => (corep: GetCorep<P, A>) => B;
    readonly cotabulate: <A, B>(
        f: (corep: GetCorep<P, A>) => B,
    ) => Get2<P, A, B>;
};
