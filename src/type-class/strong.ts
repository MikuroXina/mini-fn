import type { GetHktA2, GetHktA3, GetHktA4, Hkt2 } from "../hkt.js";
import type { Profunctor, Profunctor2, Profunctor3, Profunctor4 } from "./profunctor.js";

import type { Category } from "./category.js";

export interface Strong<Sym extends symbol> extends Profunctor<Sym> {
    readonly first: <A, B, C>(m: Hkt2<Sym, A, B>) => Hkt2<Sym, [A, C], [B, C]>;
    readonly second: <A, B, C>(m: Hkt2<Sym, A, B>) => Hkt2<Sym, [C, A], [C, B]>;
}

export interface Strong2<S> extends Profunctor2<S> {
    readonly first: <A, B, C>(m: GetHktA2<S, A, B>) => GetHktA2<S, [A, C], [B, C]>;
    readonly second: <A, B, C>(m: GetHktA2<S, A, B>) => GetHktA2<S, [C, A], [C, B]>;
}
export interface Strong3<S> extends Profunctor3<S> {
    readonly first: <A, B, C, D>(m: GetHktA3<S, A, B, D>) => GetHktA3<S, [A, C], [B, C], D>;
    readonly second: <A, B, C, D>(m: GetHktA3<S, A, B, D>) => GetHktA3<S, [C, A], [C, B], D>;
}
export interface Strong4<S> extends Profunctor4<S> {
    readonly first: <A, B, C, D, E>(
        m: GetHktA4<S, A, B, D, E>,
    ) => GetHktA4<S, [A, C], [B, C], D, E>;
    readonly second: <A, B, C, D, E>(
        m: GetHktA4<S, A, B, D, E>,
    ) => GetHktA4<S, [C, A], [C, B], D, E>;
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
