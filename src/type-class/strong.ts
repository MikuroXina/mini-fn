import type { Get2, Hkt2 } from "../hkt.js";

import type { Category } from "./category.js";
import type { Profunctor } from "./profunctor.js";

export interface Strong<S extends Hkt2> extends Profunctor<S> {
    readonly first: <A, B, C>(m: Get2<S, A, B>) => Get2<S, [A, C], [B, C]>;
    readonly second: <A, B, C>(m: Get2<S, A, B>) => Get2<S, [C, A], [C, B]>;
}

export const split =
    <S extends Hkt2>(str: Strong<S>, cat: Category<S>) =>
    <A, B>(funcA: Get2<S, A, B>) =>
    <C, D>(funcC: Get2<S, C, D>): Get2<S, [A, C], [B, D]> =>
        cat.compose<[A, C], [B, C], [B, D]>(str.first<A, B, C>(funcA))(str.second<C, D, B>(funcC));

export const fanOut = <S extends Hkt2>(str: Strong<S>, cat: Category<S>) => {
    const splitSC = split(str, cat);
    return <A, B>(funcB: Get2<S, A, B>) =>
        <C>(funcC: Get2<S, A, C>): Get2<S, A, [B, C]> =>
            cat.compose<A, [A, A], [B, C]>(
                str.diMap((a: A) => a)((a: A): [A, A] => [a, a])(cat.identity()),
            )(splitSC(funcB)(funcC));
};
