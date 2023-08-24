import type { Get2, Hkt0 } from "../hkt.js";
import type { Profunctor } from "./profunctor.js";

/**
 * An HKT extension to provide associated type `Corep` for `Corepresentable`.
 */
export interface HktCorep {
    readonly corep: unknown; // Representation type
}

export type ApplyCorep<F, R> = F extends Hkt0 ? F & { readonly corep: R } : never;

export type GetCorep<F> = F extends HktCorep ? F["corep"] : never;

export interface Corepresentable<P> extends Profunctor<P> {
    readonly coindex: <A, B>(pab: Get2<P, A, B>) => (corep: GetCorep<P>) => B;
    readonly cotabulate: <A, B>(f: (corep: GetCorep<P>) => B) => Get2<P, A, B>;
}
