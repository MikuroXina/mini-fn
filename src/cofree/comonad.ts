import type { Get1 } from "../hkt.ts";
import type { Comonad } from "../type-class/comonad.ts";
import type { Functor } from "../type-class/functor.ts";

export type ComonadCofree<F, W> = Comonad<W> & {
    functor: Functor<F>;
    readonly unwrap: <A>(wa: Get1<W, A>) => Get1<F, Get1<W, A>>;
};
