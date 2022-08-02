import type {
    HktKeyA1,
    HktKeyA2,
    HktKeyA3,
    HktKeyA4,
    GetHktA1,
    GetHktA2,
    GetHktA3,
    GetHktA4,
} from "../hkt";

export interface FlatMap1<S extends HktKeyA1> {
    flatMap<T1, U1>(a: (t: T1) => GetHktA1<S, U1>): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface FlatMap2<S extends HktKeyA2> {
    flatMap<T1, T2, U2>(
        a: (t: T2) => GetHktA2<S, T1, U2>,
    ): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface FlatMap3<S extends HktKeyA3> {
    flatMap<T1, T2, T3, U3>(
        a: (t: T3) => GetHktA3<S, T1, T2, U3>,
    ): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface FlatMap4<S extends HktKeyA4> {
    flatMap<T1, T2, T3, T4, U4>(
        a: (t: T4) => GetHktA4<S, T1, T2, T3, U4>,
    ): (t: GetHktA4<S, T1, T2, T3, T4>) => GetHktA4<S, T1, T2, T3, U4>;
}
