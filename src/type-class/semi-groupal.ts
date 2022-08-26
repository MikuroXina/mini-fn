import type { GetHktA1, GetHktA2, Hkt, HktKeyA1, HktKeyA2 } from "hkt";

export interface SemiGroupal<F extends symbol> {
    product<A, B>(fa: Hkt<F, A>): (fb: Hkt<F, B>) => Hkt<F, [A, B]>;
}

export interface SemiGroupal1<F extends HktKeyA1> {
    product<A, B>(fa: GetHktA1<F, A>): (fb: GetHktA1<F, B>) => GetHktA1<F, [A, B]>;
}
export interface SemiGroupal2<F extends HktKeyA2> {
    product<X, A, B>(fa: GetHktA2<F, X, A>): (fb: GetHktA2<F, X, B>) => GetHktA2<F, X, [A, B]>;
}
export interface SemiGroupal2Monoid<F extends HktKeyA2, M> {
    product<A, B>(fa: GetHktA2<F, M, A>): (fb: GetHktA2<F, M, B>) => GetHktA2<F, M, [A, B]>;
}
