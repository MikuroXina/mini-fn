import type { Get2 } from "../hkt.js";
import type { Category } from "./category.js";

export interface Bifunctor<P> {
    readonly biMap: <A, B>(
        first: (a: A) => B,
    ) => <C, D>(second: (c: C) => D) => (curr: Get2<P, A, C>) => Get2<P, B, D>;
}

export interface GenericBifunctor<C1, C2, C3, T> {
    readonly cat1: Category<C1>;
    readonly cat2: Category<C2>;
    readonly cat3: Category<C3>;

    readonly genericBiMap: <A, B>(
        first: Get2<C1, A, B>,
    ) => <C, D>(second: Get2<C2, C, D>) => Get2<C3, Get2<T, A, C>, Get2<T, B, D>>;
}

export const genericLeftMap =
    <C1, C2, C3, T>(gb: GenericBifunctor<C1, C2, C3, T>) =>
    <A, B, C>(f: Get2<C1, A, B>): Get2<C3, Get2<T, A, C>, Get2<T, B, C>> =>
        gb.genericBiMap(f)(gb.cat2.identity());
export const genericRightMap = <C1, C2, C3, T>(
    gb: GenericBifunctor<C1, C2, C3, T>,
): (<C, D, A>(f: Get2<C2, C, D>) => Get2<C3, Get2<T, A, C>, Get2<T, A, D>>) =>
    gb.genericBiMap(gb.cat1.identity());
