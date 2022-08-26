import type { Hkt2, HktDictA2, HktDictA3, HktDictA4, HktKeyA2, HktKeyA3, HktKeyA4 } from "../hkt";
import type { Profunctor, Profunctor2, Profunctor3, Profunctor4 } from "./profunctor";

import type { Category } from "./category";

export interface Strong<Sym extends symbol> extends Profunctor<Sym> {
    first<A, B, C>(m: Hkt2<Sym, A, B>): Hkt2<Sym, [A, C], [B, C]>;
    second<A, B, C>(m: Hkt2<Sym, A, B>): Hkt2<Sym, [C, A], [C, B]>;
}

export interface Strong2<S extends HktKeyA2> extends Profunctor2<S> {
    first<A, B, C>(m: HktDictA2<A, B>[S]): HktDictA2<[A, C], [B, C]>[S];
    second<A, B, C>(m: HktDictA2<A, B>[S]): HktDictA2<[C, A], [C, B]>[S];
}
export interface Strong3<S extends HktKeyA3> extends Profunctor3<S> {
    first<A, B, C, D>(m: HktDictA3<A, B, D>[S]): HktDictA3<[A, C], [B, C], D>[S];
    second<A, B, C, D>(m: HktDictA3<A, B, D>[S]): HktDictA3<[C, A], [C, B], D>[S];
}
export interface Strong4<S extends HktKeyA4> extends Profunctor4<S> {
    first<A, B, C, D, E>(m: HktDictA4<A, B, D, E>[S]): HktDictA4<[A, C], [B, C], D, E>[S];
    second<A, B, C, D, E>(m: HktDictA4<A, B, D, E>[S]): HktDictA4<[C, A], [C, B], D, E>[S];
}

export const split =
    <Sym extends symbol>(str: Strong<Sym>, cat: Category<Sym>) =>
    <A, B>(funcA: Hkt2<Sym, A, B>) =>
    <C, D>(funcC: Hkt2<Sym, C, D>): Hkt2<Sym, [A, C], [B, D]> =>
        cat.compose<[A, C], [B, C], [B, D]>(str.first<A, B, C>(funcA))(str.second<C, D, B>(funcC));

export const fanOut = <Sym extends symbol>(str: Strong<Sym>, cat: Category<Sym>) => {
    const splitSC = split(str, cat);
    return <A, B>(funcB: Hkt2<Sym, A, B>) =>
        <C>(funcC: Hkt2<Sym, A, C>): Hkt2<Sym, A, [B, C]> =>
            cat.compose<A, [A, A], [B, C]>(
                str.diMap<A, A>((a: A) => a)((a: A): [A, A] => [a, a])(cat.identity()),
            )(splitSC(funcB)(funcC));
};
