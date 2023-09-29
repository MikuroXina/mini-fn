import type { Get1, Get2 } from "../hkt.js";
import type { Applicative } from "./applicative.js";
import type { Bifoldable } from "./bifoldable.js";
import type { Bifunctor } from "./bifunctor.js";

export interface Bitraversable<T> extends Bifunctor<T>, Bifoldable<T> {
    bitraverse: <F>(
        app: Applicative<F>,
    ) => <A, C>(
        f: (a: A) => Get1<F, C>,
    ) => <B, D>(g: (b: B) => Get1<F, D>) => (data: Get2<T, A, B>) => Get1<F, Get2<T, C, D>>;
}
