import type { Foldable1, Foldable2 } from "./foldable";
import type { Functor1, Functor2 } from "./functor";
import type { GetHktA1, GetHktA2, HktKeyA1, HktKeyA2 } from "hkt";

import type { Applicative1 } from "./applicative";
import type { Monad1 } from "./monad";

export interface Traversable1<T extends HktKeyA1> extends Functor1<T>, Foldable1<T> {
    traverse<F extends HktKeyA1>(
        app: Applicative1<F>,
    ): <A, B>(
        visitor: (a: A) => GetHktA1<F, B>,
    ) => (data: GetHktA1<T, A>) => GetHktA1<F, GetHktA1<T, B>>;
}

export interface Traversable2<T extends HktKeyA2> extends Functor2<T>, Foldable2<T> {
    traverse<F extends HktKeyA1>(
        app: Applicative1<F>,
    ): <A, B>(
        visitor: (a: A) => GetHktA1<F, B>,
    ) => <X>(data: GetHktA2<T, X, A>) => GetHktA1<F, GetHktA2<T, X, B>>;
}

export const sequenceA = <T extends HktKeyA1, F extends HktKeyA1, A>(
    traversable: Traversable1<T>,
    app: Applicative1<F>,
): ((tfa: GetHktA1<T, GetHktA1<F, A>>) => GetHktA1<F, GetHktA1<T, A>>) =>
    traversable.traverse<F>(app)((x) => x);

export const mapM = <T extends HktKeyA1, M extends HktKeyA1, A, B>(
    traversable: Traversable1<T>,
    monad: Monad1<M>,
): ((visitor: (a: A) => GetHktA1<M, B>) => (ta: GetHktA1<T, A>) => GetHktA1<M, GetHktA1<T, B>>) =>
    traversable.traverse(monad);

export const sequence = <T extends HktKeyA1, M extends HktKeyA1, A>(
    traversable: Traversable1<T>,
    monad: Monad1<M>,
): ((tma: GetHktA1<T, GetHktA1<M, A>>) => GetHktA1<M, GetHktA1<T, A>>) =>
    sequenceA(traversable, monad);
