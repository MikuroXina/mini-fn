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

export interface Functor<F extends symbol> {
    map<T, U>(fn: (t: T) => U): (t: Hkt<F, T>) => Hkt<F, U>;
}
export interface Functor1<S extends HktKeyA1> {
    map<T1, U1>(fn: (t: T1) => U1): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface Functor2<S extends HktKeyA2> {
    map<T1, T2, U2>(fn: (t: T2) => U2): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface Functor3<S extends HktKeyA3> {
    map<T1, T2, T3, U3>(fn: (t: T3) => U3): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface Functor4<S extends HktKeyA4> {
    map<T1, T2, T3, T4, U4>(
        fn: (t: T4) => U4,
    ): (t: GetHktA4<S, T1, T2, T3, T4>) => GetHktA4<S, T1, T2, T3, U4>;
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
