import type {
    Hkt,
    HktKeyA1,
    HktKeyA2,
    HktKeyA3,
    HktKeyA4,
    GetHktA1,
    GetHktA2,
    GetHktA3,
    GetHktA4,
} from "../hkt";

export interface Pure<Symbol extends symbol> {
    pure<T>(t: T): Hkt<Symbol, T>;
}

export interface Pure1<S extends HktKeyA1> {
    pure<T1>(a: T1): GetHktA1<S, T1>;
}
export interface Pure2<S extends HktKeyA2> {
    pure<T1, T2>(a: T2): GetHktA2<S, T1, T2>;
}
export interface Pure3<S extends HktKeyA3> {
    pure<T1, T2, T3>(a: T3): GetHktA3<S, T1, T2, T3>;
}
export interface Pure4<S extends HktKeyA4> {
    pure<T1, T2, T3, T4>(a: T4): GetHktA4<S, T1, T2, T3, T4>;
}
