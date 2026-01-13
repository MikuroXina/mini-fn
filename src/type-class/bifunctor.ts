import { id } from "../func.js";
import type { Get2 } from "../hkt.js";
import type { Category } from "./category.js";

/**
 * A structure which lifts both type parameters on `P`.
 *
 * All instances of bifunctor `f` mist satisfy the following laws:
 *
 * - Identity: `f.biMap(id)(id)` equals to `id`,
 * - Composition: For all `f`, `g`, `h` and `i`; `f.biMap(compose(f)(g))(compose(h)(i))` equals to `compose(f.biMap(f)(h))(f.biMap(g)(i))`.
 */
export type Bifunctor<P> = {
    readonly biMap: <A, B>(
        first: (a: A) => B,
    ) => <C, D>(second: (c: C) => D) => (curr: Get2<P, A, C>) => Get2<P, B, D>;
};

export const first =
    <P>(bi: Bifunctor<P>) =>
    <A, B>(fn: (a: A) => B): (<C>(curr: Get2<P, A, C>) => Get2<P, B, C>) =>
        bi.biMap(fn)(id);

export const second = <P>(
    bi: Bifunctor<P>,
): (<B, C>(fn: (a: B) => C) => <A>(curr: Get2<P, A, B>) => Get2<P, A, C>) =>
    bi.biMap(id);

export type GenericBifunctor<C1, C2, C3, T> = {
    readonly cat1: Category<C1>;
    readonly cat2: Category<C2>;
    readonly cat3: Category<C3>;

    readonly genericBiMap: <A, B>(
        first: Get2<C1, A, B>,
    ) => <C, D>(
        second: Get2<C2, C, D>,
    ) => Get2<C3, Get2<T, A, C>, Get2<T, B, D>>;
};

export const genericLeftMap =
    <C1, C2, C3, T>(gb: GenericBifunctor<C1, C2, C3, T>) =>
    <A, B, C>(f: Get2<C1, A, B>): Get2<C3, Get2<T, A, C>, Get2<T, B, C>> =>
        gb.genericBiMap(f)(gb.cat2.identity());
export const genericRightMap = <C1, C2, C3, T>(
    gb: GenericBifunctor<C1, C2, C3, T>,
): (<C, D, A>(f: Get2<C2, C, D>) => Get2<C3, Get2<T, A, C>, Get2<T, A, D>>) =>
    gb.genericBiMap(gb.cat1.identity());
