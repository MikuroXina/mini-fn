import { constant } from "../func.js";
import type { Get1, Hkt1 } from "../hkt.js";
import type { Invariant } from "./variance.js";

export interface Functor<F> {
    readonly map: <T, U>(fn: (t: T) => U) => (t: Get1<F, T>) => Get1<F, U>;
}

export const map =
    <FA extends Hkt1, FB extends Hkt1>(funcA: Functor<FA>, funcB: Functor<FB>) =>
    <T, U>(f: (t: T) => U): ((funcT: Get1<FA, Get1<FB, T>>) => Get1<FA, Get1<FB, U>>) =>
        funcA.map(funcB.map(f));

export const replace =
    <F extends Hkt1>(func: Functor<F>) =>
    <A>(a: A): (<B>(fb: Get1<F, B>) => Get1<F, A>) =>
        func.map(constant(a));

export const flap =
    <S extends Hkt1>(func: Functor<S>) =>
    <T, U>(t: T) =>
        func.map((f: (argT: T) => U) => f(t));

export const bindTo =
    <S extends Hkt1>(func: Functor<S>) =>
    <N extends PropertyKey>(name: N) =>
        func.map(<T>(a: T) => ({ [name]: a } as Record<N, T>));

export const functorAsInvariant = <S extends Hkt1>(func: Functor<S>): Invariant<S> => ({
    inMap: (f) => () => func.map(f),
});
