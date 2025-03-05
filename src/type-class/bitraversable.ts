import type { Get1, Get2 } from "../hkt.ts";
import { id } from "../identity.ts";
import type { Applicative } from "./applicative.ts";
import type { Bifoldable } from "./bifoldable.ts";
import type { Bifunctor } from "./bifunctor.ts";

export type Bitraversable<T> = Bifunctor<T> & Bifoldable<T> & {
    bitraverse: <F>(
        app: Applicative<F>,
    ) => <A, C>(
        f: (a: A) => Get1<F, C>,
    ) => <B, D>(
        g: (b: B) => Get1<F, D>,
    ) => (data: Get2<T, A, B>) => Get1<F, Get2<T, C, D>>;
};

export const bisequenceA =
    <T, F>(bi: Bitraversable<T>, app: Applicative<F>) =>
    <A, B>(data: Get2<T, Get1<F, A>, Get1<F, B>>): Get1<F, Get2<T, A, B>> =>
        bi.bitraverse(app)(id<Get1<F, A>>)(id<Get1<F, B>>)(data);
