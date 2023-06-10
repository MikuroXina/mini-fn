import { type FnHkt, id } from "../func.js";
import type { Get2 } from "../hkt.js";

export interface Profunctor<S> {
    readonly diMap: <A, B>(
        f: (a: A) => B,
    ) => <C, D>(g: (c: C) => D) => (m: Get2<S, B, C>) => Get2<S, A, D>;
}

export const leftMap =
    <S>(pro: Profunctor<S>) =>
    <A, B>(f: (a: A) => B): (<C>(m: Get2<S, B, C>) => Get2<S, A, C>) =>
        pro.diMap(f)(id);
export const rightMap = <S>(
    pro: Profunctor<S>,
): (<C, D>(f: (a: C) => D) => <A>(m: Get2<S, A, C>) => Get2<S, A, D>) => pro.diMap(id);

export const fnPro: Profunctor<FnHkt> = {
    diMap: (f) => (g) => (m) => (a) => g(m(f(a))),
};
