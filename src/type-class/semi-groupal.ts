import type { GetHktA1, GetHktA2, Hkt } from "../hkt.js";

import type { Tuple } from "../tuple.js";

export interface SemiGroupal<F extends symbol> {
    readonly product: <A, B>(fa: Hkt<F, A>) => (fb: Hkt<F, B>) => Hkt<F, Tuple<A, B>>;
}

export interface SemiGroupal1<F> {
    readonly product: <A, B>(
        fa: GetHktA1<F, A>,
    ) => (fb: GetHktA1<F, B>) => GetHktA1<F, Tuple<A, B>>;
}
export interface SemiGroupal2<F> {
    readonly product: <X, A, B>(
        fa: GetHktA2<F, X, A>,
    ) => (fb: GetHktA2<F, X, B>) => GetHktA2<F, X, Tuple<A, B>>;
}
export interface SemiGroupal2Monoid<F, M> {
    readonly product: <A, B>(
        fa: GetHktA2<F, M, A>,
    ) => (fb: GetHktA2<F, M, B>) => GetHktA2<F, M, Tuple<A, B>>;
}
