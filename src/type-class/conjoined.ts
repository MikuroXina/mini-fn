import type { Get1, Get2 } from "../hkt.js";
import type { Choice } from "./choice.js";
import type { Comonad } from "./comonad.js";
import type { Corep, Corepresentable } from "./corepresentable.js";
import type { Functor } from "./functor.js";

export type Conjoined<P> = Choice<P> &
    Corepresentable<P> &
    Comonad<Corep<P>> & {
        readonly distribute: <F>(
            f: Functor<F>,
        ) => <A, B>(pab: Get2<P, A, B>) => Get2<P, Get1<F, A>, Get1<F, B>>;
    };
