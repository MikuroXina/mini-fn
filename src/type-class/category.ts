import type { GetHktA2, GetHktA3, GetHktA4, Hkt2, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";
import type { SemiGroupoid, SemiGroupoid2, SemiGroupoid3, SemiGroupoid4 } from "./semi-groupoid";

export interface Category<Sym extends symbol> extends SemiGroupoid<Sym> {
    identity<A>(): Hkt2<Sym, A, A>;
}

export interface Category2<S extends HktKeyA2> extends SemiGroupoid2<S> {
    identity<A>(): GetHktA2<S, A, A>;
}
export interface Category3<S extends HktKeyA3> extends SemiGroupoid3<S> {
    identity<A, B>(): GetHktA3<S, A, A, B>;
}
export interface Category4<S extends HktKeyA4> extends SemiGroupoid4<S> {
    identity<A, B, C>(): GetHktA4<S, A, A, B, C>;
}
