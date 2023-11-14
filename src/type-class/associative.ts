import type { Get2 } from "../hkt.ts";
import type { GenericBifunctor } from "./bifunctor.ts";
import type { Category } from "./category.ts";
import type { Iso } from "./iso.ts";

export interface Associative<Cat, P>
    extends Category<Cat>, GenericBifunctor<Cat, Cat, Cat, P> {
    readonly assoc: <A, B, C>() => Iso<
        Cat,
        Get2<P, A, Get2<P, B, C>>,
        Get2<P, Get2<P, A, B>, C>
    >;
}
