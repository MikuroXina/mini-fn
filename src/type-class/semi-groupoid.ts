import type { Hkt2, HktA2, HktA3, HktA4, HktDictA2, HktDictA3, HktDictA4 } from "../hkt";

export interface SemiGroupoid<Symbol extends symbol> {
    compose<A, B, C>(funcA: Hkt2<Symbol, A, B>): (funcB: Hkt2<Symbol, B, C>) => Hkt2<Symbol, A, C>;
}

export interface SemiGroupoid2<S extends HktA2> {
    compose<A, B, C>(funcA: HktDictA2<A, B>[S]): (funcB: HktDictA2<B, C>[S]) => HktDictA2<A, C>[S];
}
export interface SemiGroupoid3<S extends HktA3> {
    compose<A, B, C, D>(
        funcA: HktDictA3<A, B, D>[S],
    ): (funcB: HktDictA3<B, C, D>[S]) => HktDictA3<A, C, D>[S];
}
export interface SemiGroupoid4<S extends HktA4> {
    compose<A, B, C, D, E>(
        funcA: HktDictA4<A, B, D, E>[S],
    ): (funcB: HktDictA4<B, C, D, E>[S]) => HktDictA4<A, C, D, E>[S];
}
