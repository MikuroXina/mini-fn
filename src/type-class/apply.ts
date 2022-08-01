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
import type { Functor, Functor1, Functor2, Functor3, Functor4 } from "./functor";
import type { SemiGroup } from "./semi-group";

export interface Apply<Symbol extends symbol> extends Functor<Symbol> {
    apply<T, U>(fn: Hkt<Symbol, (t: T) => U>): (t: Hkt<Symbol, T>) => Hkt<Symbol, U>;
}

export interface Apply1<A extends HktA1> extends Functor1<A> {
    apply<T1, U1>(fn: HktDictA1<(t: T1) => U1>[A]): (t: HktDictA1<T1>[A]) => HktDictA1<U1>[A];
}
export interface Apply2<A extends HktA2> extends Functor2<A> {
    apply<T1, T2, U1>(
        fn: HktDictA2<(t: T1) => U1, T2>[A],
    ): (t: HktDictA2<T1, T2>[A]) => HktDictA2<U1, T2>[A];
}
export interface Apply3<A extends HktA3> extends Functor3<A> {
    apply<T1, T2, T3, U1>(
        fn: HktDictA3<(t: T1) => U1, T2, T3>[A],
    ): (t: HktDictA3<T1, T2, T3>[A]) => HktDictA3<U1, T2, T3>[A];
}
export interface Apply4<A extends HktA4> extends Functor4<A> {
    apply<T1, T2, T3, T4, U1>(
        fn: HktDictA4<(t: T1) => U1, T2, T3, T4>[A],
    ): (t: HktDictA4<T1, T2, T3, T4>[A]) => HktDictA4<U1, T2, T3, T4>[A];
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
