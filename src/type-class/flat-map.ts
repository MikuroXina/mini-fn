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

export interface FlatMap1<A extends HktA1> {
    flatMap<T1, U1>(a: (t: T1) => HktDictA1<U1>[A]): (t: HktDictA1<T1>[A]) => HktDictA1<U1>[A];
}
export interface FlatMap2<A extends HktA2> {
    flatMap<T1, T2, U1>(
        a: (t: T1) => HktDictA2<U1, T2>[A],
    ): (t: HktDictA2<T1, T2>[A]) => HktDictA2<U1, T2>[A];
}
export interface FlatMap3<A extends HktA3> {
    flatMap<T1, T2, T3, U1>(
        a: (t: T1) => HktDictA3<U1, T2, T3>[A],
    ): (t: HktDictA3<T1, T2, T3>[A]) => HktDictA3<U1, T2, T3>[A];
}
export interface FlatMap4<A extends HktA4> {
    flatMap<T1, T2, T3, T4, U1>(
        a: (t: T1) => HktDictA4<U1, T2, T3, T4>[A],
    ): (t: HktDictA4<T1, T2, T3, T4>[A]) => HktDictA4<U1, T2, T3, T4>[A];
}
