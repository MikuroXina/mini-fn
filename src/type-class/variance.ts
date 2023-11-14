import { constant } from "../func.ts";
import type { Get1 } from "../hkt.ts";
import { type Functor, replace as replaceFunctor } from "./functor.ts";

export interface Invariant<S> {
    readonly inMap: <T1, U1>(
        f: (t1: T1) => U1,
    ) => (g: (u1: U1) => T1) => (st: Get1<S, T1>) => Get1<S, U1>;
}

export interface Contravariant<S> {
    readonly contraMap: <T1, U1>(
        f: (arg: T1) => U1,
    ) => (u: Get1<S, U1>) => Get1<S, T1>;
}

export const replace =
    <F>(contra: Contravariant<F>) =>
    <B>(b: B): <A>(fb: Get1<F, B>) => Get1<F, A> =>
        contra.contraMap(constant(b));

export const replaceFlipped =
    <F>(contra: Contravariant<F>) =>
    <B>(fb: Get1<F, B>) =>
    <A>(b: B): Get1<F, A> => contra.contraMap(constant(b))(fb);

export const phantom =
    <F>(functor: Functor<F>, contra: Contravariant<F>) =>
    <A, B>(fa: Get1<F, A>): Get1<F, B> =>
        replaceFlipped(contra)(replaceFunctor(functor)([])(fa))([]);

export const contraAsIn = <S>(contra: Contravariant<S>): Invariant<S> => ({
    inMap: () => contra.contraMap,
});
