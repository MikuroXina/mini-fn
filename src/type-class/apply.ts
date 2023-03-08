import { pipe } from "../func.js";
import type { Get1 } from "../hkt.js";
import type { Functor } from "./functor.js";
import type { SemiGroup } from "./semi-group.js";

export interface Apply<S> extends Functor<S> {
    readonly apply: <T, U>(fn: Get1<S, (t: T) => U>) => (t: Get1<S, T>) => Get1<S, U>;
}

export const ap =
    <SA, SB>(applyA: Apply<SA>, applyB: Apply<SB>) =>
    <T>(funcT: Get1<SA, Get1<SB, T>>) =>
    <U>(funcM: Get1<SA, Get1<SB, (t: T) => U>>): Get1<SA, Get1<SB, U>> =>
        applyA.apply(applyA.map(applyB.apply)(funcM))(funcT);

export const apFirst =
    <S>(apply: Apply<S>) =>
    <T>(first: Get1<S, T>): (<U>(second: Get1<S, U>) => Get1<S, T>) =>
        apply.apply(apply.map((t: T) => () => t)(first));

export const apSecond =
    <S>(apply: Apply<S>) =>
    <T>(first: Get1<S, T>): (<U>(second: Get1<S, U>) => Get1<S, U>) =>
        apply.apply(
            apply.map(
                () =>
                    <U>(u: U) =>
                        u,
            )(first),
        );

export const apSelective =
    <S>(apply: Apply<S>) =>
    <N extends PropertyKey, T>(name: Exclude<N, keyof T>) =>
    (
        funcT: Get1<S, T>,
    ): (<U>(funcU: Get1<S, U>) => Get1<S, { [K in keyof T | N]: K extends keyof T ? T[K] : U }>) =>
        apply.apply(
            apply.map(
                (t: T) =>
                    <U>(u: U) =>
                        ({ ...t, [name]: u } as {
                            [K in keyof T | N]: K extends keyof T ? T[K] : U;
                        }),
            )(funcT),
        );

export const map2 =
    <F>(app: Apply<F>) =>
    <A, B, C>(f: (a: A) => (b: B) => C): ((fa: Get1<F, A>) => (fb: Get1<F, B>) => Get1<F, C>) =>
        pipe(app.map(f))(app.apply);

export const makeSemiGroup =
    <S>(apply: Apply<S>) =>
    <T>(semi: SemiGroup<T>): SemiGroup<Get1<S, T>> => ({
        combine: (l, r) =>
            apply.apply(apply.map((left: T) => (right: T) => semi.combine(left, right))(l))(r),
    });
