import type { Get2, Hkt2 } from "../hkt.js";

import { id } from "../func.js";

export interface Profunctor<S extends Hkt2> {
    readonly diMap: <A, B>(
        f: (a: A) => B,
    ) => <C, D>(g: (c: C) => D) => (m: Get2<S, B, C>) => Get2<S, A, D>;
}

export const leftMap =
    <S extends Hkt2>(pro: Profunctor<S>) =>
    <A, B>(f: (a: A) => B): (<C>(m: Get2<S, B, C>) => Get2<S, A, C>) =>
        pro.diMap(f)(id);
export const rightMap = <S extends Hkt2>(
    pro: Profunctor<S>,
): (<C, D>(f: (a: C) => D) => <A>(m: Get2<S, A, C>) => Get2<S, A, D>) => pro.diMap(id);

export interface FnHkt extends Hkt2 {
    readonly type: (arg: this["arg2"]) => this["arg1"];
}

export const fnPro: Profunctor<FnHkt> = {
    diMap: (f) => (g) => (m) => (a) => g(m(f(a))),
};
