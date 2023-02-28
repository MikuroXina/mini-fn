import { compose, id } from "./func.js";
import type { Get1, Hkt1, Hkt2 } from "./hkt.js";
import type { Functor } from "./type-class/functor.js";

export interface Yoneda<F, A> {
    readonly yoneda: <X>(fn: (a: A) => X) => Get1<F, X>;
}

export const lift =
    <F extends Hkt1>(functor: Functor<F>) =>
    <A>(a: Get1<F, A>): Yoneda<F, A> => ({
        yoneda: (f) => functor.map(f)(a),
    });

export const lower = <F, A>(y: Yoneda<F, A>): Get1<F, A> => y.yoneda(id);

export const map =
    <A, B>(mapper: (a: A) => B) =>
    <F>(y: Yoneda<F, A>): Yoneda<F, B> => ({
        yoneda: <X>(fn: (b: B) => X) => y.yoneda<X>(compose(fn)(mapper)),
    });

export interface YonedaHkt extends Hkt2 {
    readonly type: Yoneda<this["arg2"], this["arg1"]>;
}

export const functor: Functor<YonedaHkt> = { map };
