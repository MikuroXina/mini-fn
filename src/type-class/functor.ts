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

export interface Functor<F extends symbol> {
    map<T, U>(fn: (t: T) => U): (t: Hkt<F, T>) => Hkt<F, U>;
}
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

export const map =
    <SymbolA extends symbol, SymbolB extends symbol>(
        funcA: Functor<SymbolA>,
        funcB: Functor<SymbolB>,
    ) =>
    <T, U>(f: (t: T) => U) =>
    (funcT: Hkt<SymbolA, Hkt<SymbolB, T>>) =>
        funcA.map(funcB.map(f))(funcT);

export const flap =
    <Symbol extends symbol>(func: Functor<Symbol>) =>
    <T, U>(t: T) =>
        func.map((f: (t: T) => U) => f(t));

export const bindTo =
    <Symbol extends symbol>(func: Functor<Symbol>) =>
    <N extends keyof any>(name: N) =>
        func.map(<T>(a: T) => ({ [name]: a } as Record<N, T>));
