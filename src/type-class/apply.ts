import type { Functor, Functor1, Functor2, Functor2Monoid, Functor3, Functor4 } from "./functor.js";
import type { GetHktA1, GetHktA2, GetHktA3, GetHktA4, Hkt } from "../hkt.js";
import type { SemiGroupal1, SemiGroupal2, SemiGroupal2Monoid } from "./semi-groupal.js";

import type { SemiGroup } from "./semi-group.js";

export interface Apply<Sym extends symbol> extends Functor<Sym> {
    apply<T, U>(fn: Hkt<Sym, (t: T) => U>): (t: Hkt<Sym, T>) => Hkt<Sym, U>;
}

export interface Apply1<S> extends Functor1<S>, SemiGroupal1<S> {
    apply<T1, U1>(fn: GetHktA1<S, (t: T1) => U1>): (t: GetHktA1<S, T1>) => GetHktA1<S, U1>;
}
export interface Apply2<S> extends Functor2<S>, SemiGroupal2<S> {
    apply<T1, T2, U2>(
        fn: GetHktA2<S, T1, (t: T2) => U2>,
    ): (t: GetHktA2<S, T1, T2>) => GetHktA2<S, T1, U2>;
}
export interface Apply2Monoid<S, M> extends Functor2Monoid<S, M>, SemiGroupal2Monoid<S, M> {
    apply<T2, U2>(fn: GetHktA2<S, M, (t: T2) => U2>): (t: GetHktA2<S, M, T2>) => GetHktA2<S, M, U2>;
}
export interface Apply3<S> extends Functor3<S> {
    apply<T1, T2, T3, U3>(
        fn: GetHktA3<S, T1, T2, (t: T3) => U3>,
    ): (t: GetHktA3<S, T1, T2, T3>) => GetHktA3<S, T1, T2, U3>;
}
export interface Apply4<S> extends Functor4<S> {
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
    <Sym extends symbol>(apply: Apply<Sym>) =>
    <T>(first: Hkt<Sym, T>) =>
    <U>(second: Hkt<Sym, U>): Hkt<Sym, T> =>
        apply.apply(apply.map((t: T) => () => t)(first))(second);

export const apSecond =
    <Sym extends symbol>(apply: Apply<Sym>) =>
    <T>(first: Hkt<Sym, T>) =>
    <U>(second: Hkt<Sym, U>): Hkt<Sym, U> =>
        apply.apply(apply.map(() => (u: U) => u)(first))(second);

export const apSelective =
    <Sym extends symbol>(apply: Apply<Sym>) =>
    <N extends PropertyKey, T>(name: Exclude<N, keyof T>) =>
    (funcT: Hkt<Sym, T>) =>
    <U>(funcU: Hkt<Sym, U>): Hkt<Sym, { [K in keyof T | N]: K extends keyof T ? T[K] : U }> =>
        apply.apply(
            apply.map(
                (t: T) => (u: U) =>
                    ({ ...t, [name]: u } as { [K in keyof T | N]: K extends keyof T ? T[K] : U }),
            )(funcT),
        )(funcU);

export const map2 =
    <F>(app: Apply1<F>) =>
    <A, B, C>(f: (a: A) => (b: B) => C) =>
    (fa: GetHktA1<F, A>): ((fb: GetHktA1<F, B>) => GetHktA1<F, C>) =>
        app.apply(app.map(f)(fa));

export const makeSemiGroup =
    <Sym extends symbol>(apply: Apply<Sym>) =>
    <T>(semi: SemiGroup<T>): SemiGroup<Hkt<Sym, T>> => ({
        combine: (l, r) =>
            apply.apply(apply.map((left: T) => (right: T) => semi.combine(left, right))(l))(r),
    });
