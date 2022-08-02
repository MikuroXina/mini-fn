import type { Hkt2, HktA2, HktA3, HktA4, HktDictA2, HktDictA3, HktDictA4 } from "../hkt";

export interface Profunctor<Symbol extends symbol> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => (m: Hkt2<Symbol, B, C>) => Hkt2<Symbol, A, D>;
}

export interface Profunctor2<S extends HktA2> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => (m: HktDictA2<B, C>[S]) => HktDictA2<A, D>[S];
}
export interface Profunctor3<S extends HktA3> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T>(m: HktDictA3<B, C, T>[S]) => HktDictA3<A, D, T>[S];
}
export interface Profunctor4<S extends HktA4> {
    diMap<A, B>(
        f: (a: A) => B,
    ): <C, D>(g: (c: C) => D) => <T, U>(m: HktDictA4<B, C, T, U>[S]) => HktDictA4<A, D, T, U>[S];
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
