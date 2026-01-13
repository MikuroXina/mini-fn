import type { Get2 } from "../hkt.js";
import type { GenericBifunctor } from "./bifunctor.js";
import type { Category } from "./category.js";
import type { Iso } from "./iso.js";

export type Associative<Cat, P> = Category<Cat> &
    GenericBifunctor<Cat, Cat, Cat, P> & {
        readonly assoc: <A, B, C>() => Iso<
            Cat,
            Get2<P, A, Get2<P, B, C>>,
            Get2<P, Get2<P, A, B>, C>
        >;
    };
