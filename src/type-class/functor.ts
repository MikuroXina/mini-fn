import type {
    HktA1,
    HktA2,
    HktA3,
    HktA4,
    HktDictA1,
    HktDictA2,
    HktDictA3,
    HktDictA4,
} from "../hkt";

export interface Functor1<A extends HktA1> {
    map<T1, U1>(fn: (t: T1) => U1): (t: HktDictA1<T1>[A]) => HktDictA1<U1>[A];
}
export interface Functor2<A extends HktA2> {
    map<T1, T2, U1>(fn: (t: T1) => U1): (t: HktDictA2<T1, T2>[A]) => HktDictA2<U1, T2>[A];
}
export interface Functor3<A extends HktA3> {
    map<T1, T2, T3, U1>(
        fn: (t: T1) => U1,
    ): (t: HktDictA3<T1, T2, T3>[A]) => HktDictA3<U1, T2, T3>[A];
}
export interface Functor4<A extends HktA4> {
    map<T1, T2, T3, T4, U1>(
        fn: (t: T1) => U1,
    ): (t: HktDictA4<T1, T2, T3, T4>[A]) => HktDictA4<U1, T2, T3, T4>[A];
}
