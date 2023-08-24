import type { Get2, Hkt1, Instance } from "src/hkt.js";

import type { Profunctor } from "./profunctor.js";

/**
 * An HKT extension to provide associated type `Corep` for `Corepresentable`.
 */
export interface HktCorep {
    readonly rep: unknown; // Representation type
}

export type ApplyCorep<F, R> = F extends Hkt1 ? F & { readonly rep: R } : never;

export type GetCorep<F> = F extends HktCorep ? Instance<F["rep"]> : never;

export interface Corepresentable<P> extends Profunctor<P> {
    readonly coindex: <A, B>(pab: Get2<P, A, B>) => (corep: GetCorep<P>) => B;
    readonly cotabulate: <A, B>(f: (corep: GetCorep<P>) => B) => Get2<P, A, B>;
}
