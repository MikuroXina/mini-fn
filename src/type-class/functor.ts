import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "../hkt";

import type { Invariant } from "./variance";

export interface Functor<F extends symbol> {
    map<T, U>(fn: (t: T) => U): (t: Hkt<F, T>) => Hkt<F, U>;
}
export interface Functor1<S> {
    map<T1, U1>(fn: (t: T1) => U1): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface Functor2<S> {
    map<T1, T2, U2>(fn: (t: T2) => U2): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface Functor2Monoid<S, M> {
    map<T2, U2>(fn: (t: T2) => U2): (t: GetHktA2<S, M, T2>) => GetHktA2<S, M, U2>;
}
export interface Functor3<S> {
    map<T1, T2, T3, U3>(fn: (t: T3) => U3): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface Functor4<S> {
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
    <Sym extends symbol>(func: Functor<Sym>) =>
    <T, U>(t: T) =>
        func.map((f: (argT: T) => U) => f(t));

export const bindTo =
    <Sym extends symbol>(func: Functor<Sym>) =>
    <N extends PropertyKey>(name: N) =>
        func.map(<T>(a: T) => ({ [name]: a } as Record<N, T>));

export const functorAsInvariant = <S>(func: Functor1<S>): Invariant<S> => ({
    inMap: (f) => () => func.map(f),
});
