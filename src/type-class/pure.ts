import type {
    Hkt,
    HktA1,
    HktA2,
    HktA3,
    HktA4,
    HktDictA1,
    HktDictA2,
    HktDictA3,
    HktDictA4,
} from "../hkt";

export interface Pure<Symbol extends symbol> {
    pure<T>(t: T): Hkt<Symbol, T>;
}

export interface Pure1<A extends HktA1> {
    pure<T1>(a: T1): HktDictA1<T1>[A];
}
export interface Pure2<A extends HktA2> {
    pure<T1, T2>(a: T1): HktDictA2<T1, T2>[A];
}
export interface Pure3<A extends HktA3> {
    pure<T1, T2, T3>(a: T1): HktDictA3<T1, T2, T3>[A];
}
export interface Pure4<A extends HktA4> {
    pure<T1, T2, T3, T4>(a: T1): HktDictA4<T1, T2, T3, T4>[A];
}
