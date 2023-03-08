import type { Get1 } from "../hkt.js";
import type { Applicative } from "./applicative.js";
import type { Foldable } from "./foldable.js";
import type { Functor } from "./functor.js";
import type { Monad } from "./monad.js";

export interface Traversable<T> extends Functor<T>, Foldable<T> {
    readonly traverse: <F>(
        app: Applicative<F>,
    ) => <A, B>(visitor: (a: A) => Get1<F, B>) => (data: Get1<T, A>) => Get1<F, Get1<T, B>>;
}

export const sequenceA = <T, F, A>(
    traversable: Traversable<T>,
    app: Applicative<F>,
): ((tfa: Get1<T, Get1<F, A>>) => Get1<F, Get1<T, A>>) => traversable.traverse<F>(app)((x) => x);

export const mapM = <T, M, A, B>(
    traversable: Traversable<T>,
    monad: Monad<M>,
): ((visitor: (a: A) => Get1<M, B>) => (ta: Get1<T, A>) => Get1<M, Get1<T, B>>) =>
    traversable.traverse(monad);

export const sequence = <T, M, A>(
    traversable: Traversable<T>,
    monad: Monad<M>,
): ((tma: Get1<T, Get1<M, A>>) => Get1<M, Get1<T, A>>) => sequenceA(traversable, monad);
