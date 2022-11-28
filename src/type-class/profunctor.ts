import type { GetHktA2, GetHktA3, GetHktA4, Hkt2 } from "../hkt";

export interface Profunctor<Sym extends symbol> {
    diMap<A, B>(f: (a: A) => B): <C, D>(g: (c: C) => D) => (m: Hkt2<Sym, D, A>) => Hkt2<Sym, C, B>;
}

export interface Profunctor2<S> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => (m: GetHktA2<S, D, A>) => GetHktA2<S, C, B>;
}
export interface Profunctor3<S> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T>(m: GetHktA3<S, T, D, A>) => GetHktA3<S, T, C, B>;
}
export interface Profunctor4<S> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T, U>(m: GetHktA4<S, T, U, D, A>) => GetHktA4<S, T, U, C, B>;
}

export const leftMap =
    <Sym extends symbol>(pro: Profunctor<Sym>) =>
    <A, B>(f: (a: A) => B): (<C>(m: Hkt2<Sym, B, C>) => Hkt2<Sym, A, C>) =>
        pro.diMap(f)((c) => c);
export const rightMap =
    <Sym extends symbol>(pro: Profunctor<Sym>) =>
    <C, D>(f: (a: C) => D) =>
    <A>(m: Hkt2<Sym, A, C>): Hkt2<Sym, A, D> =>
        pro.diMap((a: A) => a)(f)(m);
