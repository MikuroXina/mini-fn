import type { Get1, Get2, Hkt0, Hkt1 } from "../hkt.ts";
import type { Functor } from "./functor.ts";
import type { Strong } from "./strong.ts";

/**
 * An HKT extension to provide associated type `Rep` for `Representable`.
 */
export interface HktRep {
    readonly rep: Hkt1; // Representation type
}

export type ApplyRep<P, H> = P extends Hkt0 ? P & { readonly rep: H } : never;
export type Rep<P> = P extends HktRep ? P["rep"] : never;
export type GetRep<P, T> = Get1<Rep<P>, T>;

/**
 * `F` should extend `HktRep` because functions below require `HktRep`.
 *
 * All instances of `Representable` must satisfy these laws:
 *
 * - `compose(index)(tabulate) == id`,
 * - `compose(tabulate)(index) == id`.
 */
export interface Representable<P> extends Strong<P> {
    readonly functor: Functor<Rep<P>>;
    readonly index: <T, U>(f: Get2<P, T, U>) => (rep: T) => GetRep<P, U>;
    readonly tabulate: <T, U>(f: (rep: T) => GetRep<P, U>) => Get2<P, T, U>;
}

export const first =
    <P>(p: Representable<P>) =>
    <A, B, C>(pab: Get2<P, A, B>): Get2<P, [A, C], [B, C]> =>
        p.tabulate(([a, c]) =>
            p.functor.map((b: B) => [b, c])(p.index(pab)(a))
        );

export const second =
    <P>(p: Representable<P>) =>
    <A, B, C>(pab: Get2<P, A, B>): Get2<P, [C, A], [C, B]> =>
        p.tabulate(([c, a]) =>
            p.functor.map((b: B) => [c, b])(p.index(pab)(a))
        );
