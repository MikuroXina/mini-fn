import { compose, id } from "./func.ts";
import type { Apply2Only, Get1, Hkt2 } from "./hkt.ts";
import type { Functor } from "./type-class/functor.ts";
import type { PartialEqUnary } from "./type-class/partial-eq.ts";

/**
 * The yoneda functor, a partial application of `map` to its second argument.
 */
export type Yoneda<F, A> = {
    readonly yoneda: <X>(fn: (a: A) => X) => Get1<F, X>;
};

/**
 * The `PartialEqUnary` instance for `Yoneda<F, _>`.
 */
export const partialEqUnary = <F>(
    eqUnary: PartialEqUnary<F>,
): PartialEqUnary<YonedaHkt> => ({
    liftEq:
        <L, R = L>(equality: (l: L, r: R) => boolean) =>
        (l: Yoneda<F, L>, r: Yoneda<F, R>): boolean =>
            eqUnary.liftEq(equality)(l.yoneda(id), r.yoneda(id)),
});

/**
 * Lifts the value `a` into a partial application of `functor.map`. It is the natural isomorphism to `Yoneda<F, _>`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param a - The value in `F`.
 * @returns The partial application of `functor.map`.
 */
export const lift =
    <F>(functor: Functor<F>) => <A>(a: Get1<F, A>): Yoneda<F, A> => ({
        yoneda: (f) => functor.map(f)(a),
    });

/**
 * Lowers the yoneda into the value in `F`. It is the natural isomorphism from `Yoneda<F, _>`.
 *
 * @param y - The yoneda to be lowered.
 * @returns The inner value in `F`.
 */
export const lower = <F, A>(y: Yoneda<F, A>): Get1<F, A> => y.yoneda(id);

/**
 * Maps the yoneda with `mapper`.
 *
 * @param mapper - The function to map from `A`.
 * @param y - The yoneda to be mapped.
 * @returns The mapped yoneda
 */
export const map =
    <A, B>(mapper: (a: A) => B) => <F>(y: Yoneda<F, A>): Yoneda<F, B> => ({
        yoneda: <X>(fn: (b: B) => X) => y.yoneda<X>(compose(fn)(mapper)),
    });

export interface YonedaHkt extends Hkt2 {
    readonly type: Yoneda<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Yoneda<F, _>`.
 */
export const functor = <F>(): Functor<Apply2Only<YonedaHkt, F>> => ({ map });
