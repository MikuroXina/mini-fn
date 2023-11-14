import type { Get1, Get2 } from "../hkt.ts";
import type { Choice } from "./choice.ts";
import type { Comonad } from "./comonad.ts";
import type { Corep, Corepresentable } from "./corepresentable.ts";
import type { Functor } from "./functor.ts";

export interface Conjoined<P>
    extends Choice<P>, Corepresentable<P>, Comonad<Corep<P>> {
    readonly distribute: <F>(
        f: Functor<F>,
    ) => <A, B>(pab: Get2<P, A, B>) => Get2<P, Get1<F, A>, Get1<F, B>>;
}
