import type { Hkt2, HktA2, HktA3, HktA4, HktDictA2, HktDictA3, HktDictA4 } from "../hkt";
import type { SemiGroupoid, SemiGroupoid2, SemiGroupoid3, SemiGroupoid4 } from "./semi-groupoid";

export interface Category<Symbol extends symbol> extends SemiGroupoid<Symbol> {
    identity<A>(): Hkt2<Symbol, A, A>;
}

export interface Category2<S extends HktA2> extends SemiGroupoid2<S> {
    identity<A>(): HktDictA2<A, A>[S];
}
export interface Category3<S extends HktA3> extends SemiGroupoid3<S> {
    identity<A, B>(): HktDictA3<A, A, B>[S];
}
export interface Category4<S extends HktA4> extends SemiGroupoid4<S> {
    identity<A, B, C>(): HktDictA4<A, A, B, C>[S];
}
