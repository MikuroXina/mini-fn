import type { Get2, Hkt2 } from "../hkt.js";
import type { Category } from "./category.js";
import { Profunctor, rightMap } from "./profunctor.js";

export interface Strong<S extends Hkt2> extends Profunctor<S> {
    readonly first: <A, B, C>(m: Get2<S, A, B>) => Get2<S, [A, C], [B, C]>;
    readonly second: <A, B, C>(m: Get2<S, A, B>) => Get2<S, [C, A], [C, B]>;
}

export const split =
    <S extends Hkt2>(str: Strong<S>, cat: Category<S>) =>
    <A, B>(funcA: Get2<S, A, B>) =>
    <C, D>(funcC: Get2<S, C, D>): Get2<S, [A, C], [B, D]> =>
        cat.compose(str.first<A, B, D>(funcA))<[A, C]>(str.second(funcC));

export const fanOut =
    <S extends Hkt2>(str: Strong<S>, cat: Category<S>) =>
    <A, B>(funcB: Get2<S, A, B>): (<C>(funcC: Get2<S, A, C>) => Get2<S, A, [B, C]>) => {
        const splitSC: <C, D>(func: Get2<S, C, D>) => Get2<S, [A, C], [B, D]> = split(
            str,
            cat,
        )(funcB);
        return <C>(funcC: Get2<S, A, C>): Get2<S, A, [B, C]> =>
            cat.compose(splitSC(funcC))(rightMap(str)((a: A): [A, A] => [a, a])(cat.identity()));
    };
