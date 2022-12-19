import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "../hkt.js";

export interface FlatMap<S extends symbol> {
    flatMap<T1, U1>(a: (t: T1) => Hkt<S, U1>): (t: Hkt<S, T1>) => Hkt<S, U1>;
}

export interface FlatMap1<S> {
    flatMap<T1, U1>(a: (t: T1) => GetHktA1<S, U1>): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface FlatMap2<S> {
    flatMap<T1, T2, U2>(
        a: (t: T2) => GetHktA2<S, T1, U2>,
    ): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface FlatMap2Monoid<S, M> {
    flatMap<T2, U2>(
        a: (t: T2) => GetHktA2<S, M, U2>,
    ): (t: GetHktA2<S, M, T2>) => GetHktA2<S, M, U2>;
}
export interface FlatMap3<S> {
    flatMap<T1, T2, T3, U3>(
        a: (t: T3) => GetHktA3<S, T1, T2, U3>,
    ): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface FlatMap4<S> {
    flatMap<T1, T2, T3, T4, U4>(
        a: (t: T4) => GetHktA4<S, T1, T2, T3, U4>,
    ): (t: GetHktA4<S, T1, T2, T3, T4>) => GetHktA4<S, T1, T2, T3, U4>;
}
