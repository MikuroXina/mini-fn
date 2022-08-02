import type { Hkt2, HktKeyA2, HktKeyA3, HktKeyA4, GetHktA2, GetHktA3, GetHktA4 } from "../hkt";

export interface Profunctor<Symbol extends symbol> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => (m: Hkt2<Symbol, D, A>) => Hkt2<Symbol, C, B>;
}

export interface Profunctor2<S extends HktKeyA2> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => (m: GetHktA2<S, D, A>) => GetHktA2<S, C, B>;
}
export interface Profunctor3<S extends HktKeyA3> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T>(m: GetHktA3<S, T, D, A>) => GetHktA3<S, T, C, B>;
}
export interface Profunctor4<S extends HktKeyA4> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T, U>(m: GetHktA4<S, T, U, D, A>) => GetHktA4<S, T, U, C, B>;
}

export const leftMap =
    <Symbol extends symbol>(pro: Profunctor<Symbol>) =>
    <A, B>(f: (a: A) => B): (<C>(m: Hkt2<Symbol, B, C>) => Hkt2<Symbol, A, C>) =>
        pro.diMap(f)((c) => c);
export const rightMap =
    <Symbol extends symbol>(pro: Profunctor<Symbol>) =>
    <C, D>(f: (a: C) => D) =>
    <A>(m: Hkt2<Symbol, A, C>): Hkt2<Symbol, A, D> =>
        pro.diMap((a: A) => a)(f)(m);
