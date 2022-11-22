import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "../hkt";

export interface Pure<Sym extends symbol> {
    pure<T>(t: T): Hkt<Sym, T>;
}

export interface Pure1<S> {
    pure<T1>(a: T1): GetHktA1<S, T1>;
}
export interface Pure2<S> {
    pure<T1, T2>(a: T2): GetHktA2<S, T1, T2>;
}
export interface Pure2Monoid<S, M> {
    pure<T2>(a: T2): GetHktA2<S, M, T2>;
}
export interface Pure3<S> {
    pure<T1, T2, T3>(a: T3): GetHktA3<S, T1, T2, T3>;
}
export interface Pure4<S> {
    pure<T1, T2, T3, T4>(a: T4): GetHktA4<S, T1, T2, T3, T4>;
}
