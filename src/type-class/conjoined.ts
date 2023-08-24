import type { Get1, Get2 } from "../hkt.js";
import type { Comonad } from "./comonad.js";
import type { Corepresentable } from "./corepresentable.js";
import type { Functor } from "./functor.js";
import type { Profunctor } from "./profunctor.js";

export interface Conjoined<P> extends Profunctor<P>, Corepresentable<P>, Comonad<P> {
    readonly distribute: <F>(
        f: Functor<F>,
    ) => <A, B>(pab: Get2<P, A, B>) => Get2<P, Get1<F, A>, Get1<F, B>>;
}
