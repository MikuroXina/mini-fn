import type { Hkt2, HktDictA2, HktDictA3, HktDictA4, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";

export interface SemiGroupoid<Sym extends symbol> {
    compose<A, B, C>(funcA: Hkt2<Sym, A, B>): (funcB: Hkt2<Sym, B, C>) => Hkt2<Sym, A, C>;
}

export interface SemiGroupoid2<S extends HktKeyA2> {
    compose<A, B, C>(funcA: HktDictA2<A, B>[S]): (funcB: HktDictA2<B, C>[S]) => HktDictA2<A, C>[S];
}
export interface SemiGroupoid3<S extends HktKeyA3> {
    compose<A, B, C, D>(
        funcA: HktDictA3<A, B, D>[S],
    ): (funcB: HktDictA3<B, C, D>[S]) => HktDictA3<A, C, D>[S];
}
export interface SemiGroupoid4<S extends HktKeyA4> {
    compose<A, B, C, D, E>(
        funcA: HktDictA4<A, B, D, E>[S],
    ): (funcB: HktDictA4<B, C, D, E>[S]) => HktDictA4<A, C, D, E>[S];
}
