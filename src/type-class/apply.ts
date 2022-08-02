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
import type { Functor, Functor1, Functor2, Functor3, Functor4 } from "./functor";
import type { SemiGroup } from "./semi-group";

export interface Apply<Symbol extends symbol> extends Functor<Symbol> {
    apply<T, U>(fn: Hkt<Symbol, (t: T) => U>): (t: Hkt<Symbol, T>) => Hkt<Symbol, U>;
}

export interface Apply1<S extends HktKeyA1> extends Functor1<S> {
    apply<T1, U1>(fn: GetHktA1<S, (t: T1) => U1>): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface Apply2<S extends HktKeyA2> extends Functor2<S> {
    apply<T1, T2, U2>(
        fn: GetHktA2<S, T1, (t: T2) => U2>,
    ): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface Apply2Monoid<S extends HktKeyA2, M> extends Functor2<S> {
    apply<T2, U2>(fn: GetHktA2<S, M, (t: T2) => U2>): (t: GetHktA2<S, M, T2>) => GetHktA2<S, M, U2>;
}
export interface Apply3<S extends HktKeyA3> extends Functor3<S> {
    apply<T1, T2, T3, U3>(
        fn: GetHktA3<S, T1, T2, (t: T3) => U3>,
    ): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface Apply4<S extends HktKeyA4> extends Functor4<S> {
    apply<T1, T2, T3, T4, U4>(
        fn: GetHktA4<S, T1, T2, T3, (t: T4) => U4>,
    ): (t: GetHktA4<S, T1, T2, T3, T4>) => GetHktA4<S, T1, T2, T3, U4>;
}

export const ap =
    <SymbolA extends symbol, SymbolB extends symbol>(
        applyA: Apply<SymbolA>,
        applyB: Apply<SymbolB>,
    ) =>
    <T>(funcT: Hkt<SymbolA, Hkt<SymbolB, T>>) =>
    <U>(funcM: Hkt<SymbolA, Hkt<SymbolB, (t: T) => U>>): Hkt<SymbolA, Hkt<SymbolB, U>> =>
        applyA.apply(applyA.map(applyB.apply)(funcM))(funcT);

export const apFirst =
    <Symbol extends symbol>(apply: Apply<Symbol>) =>
    <T>(first: Hkt<Symbol, T>) =>
    <U>(second: Hkt<Symbol, U>): Hkt<Symbol, T> =>
        apply.apply(apply.map((t: T) => () => t)(first))(second);

export const apSecond =
    <Symbol extends symbol>(apply: Apply<Symbol>) =>
    <T>(first: Hkt<Symbol, T>) =>
    <U>(second: Hkt<Symbol, U>): Hkt<Symbol, U> =>
        apply.apply(apply.map(() => (u: U) => u)(first))(second);

export const apSelective =
    <Symbol extends symbol>(apply: Apply<Symbol>) =>
    <N extends keyof any, T>(name: Exclude<N, keyof T>) =>
    (funcT: Hkt<Symbol, T>) =>
    <U>(funcU: Hkt<Symbol, U>): Hkt<Symbol, { [K in keyof T | N]: K extends keyof T ? T[K] : U }> =>
        apply.apply(
            apply.map(
                (t: T) => (u: U) =>
                    ({ ...t, [name]: u } as { [K in keyof T | N]: K extends keyof T ? T[K] : U }),
            )(funcT),
        )(funcU);

export const makeSemiGroup =
    <Symbol extends symbol>(apply: Apply<Symbol>) =>
    <T>(semi: SemiGroup<T>): SemiGroup<Hkt<Symbol, T>> => ({
        combine: (l, r) => apply.apply(apply.map((l: T) => (r: T) => semi.combine(l, r))(l))(r),
    });
