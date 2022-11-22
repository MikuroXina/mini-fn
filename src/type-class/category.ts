import type { GetHktA2, GetHktA3, GetHktA4, Hkt2 } from "../hkt";
import type { SemiGroupoid, SemiGroupoid2, SemiGroupoid3, SemiGroupoid4 } from "./semi-groupoid";

export interface Category<Sym extends symbol> extends SemiGroupoid<Sym> {
    identity<A>(): Hkt2<Sym, A, A>;
}

export interface Category2<S> extends SemiGroupoid2<S> {
    identity<A>(): GetHktA2<S, A, A>;
}
export interface Category3<S> extends SemiGroupoid3<S> {
    identity<A, B>(): GetHktA3<S, A, A, B>;
}
export interface Category4<S> extends SemiGroupoid4<S> {
    identity<A, B, C>(): GetHktA4<S, A, A, B, C>;
}
