import type { Apply3Only, Get1, Hkt3 } from "./hkt.ts";
import type { Functor } from "./type-class/functor.ts";
import { type Profunctor, rightMap } from "./type-class/profunctor.ts";

export interface Star<F, D, C> {
    (d: D): Get1<F, C>;
}

export interface StarHkt extends Hkt3 {
    readonly type: Star<this["arg3"], this["arg2"], this["arg1"]>;
}

export const pro = <F>(
    functor: Functor<F>,
): Profunctor<Apply3Only<StarHkt, F>> => ({
    diMap: (f) => (g) => (m) => (d) => functor.map(g)(m(f(d))),
});

export const map = <F>(functor: Functor<F>) => rightMap(pro(functor));
