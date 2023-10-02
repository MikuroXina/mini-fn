import { applicative, newConst } from "../const.js";
import type { Get1 } from "../hkt.js";
import { type Foldable, foldMap } from "../type-class/foldable.js";
import type { Monoid } from "../type-class/monoid.js";
import type { Traversable } from "../type-class/traversable.js";

export interface Fold<S, A, M> {
    (over: (a: A) => M): (s: S) => M;
}

/**
 * Creates a new `Fold` from function. It is equivalent to an identity function.
 */
export const folds = <S, A, M>(l: (over: (a: A) => M) => (s: S) => M): Fold<S, A, M> => l;

export const foldMapOf =
    <T, A, M>(tra: Traversable<T>, monoid: Monoid<M>): Fold<Get1<T, A>, A, M> =>
    (f: (a: A) => M) =>
    (data: Get1<T, A>): M =>
        tra.traverse(applicative(monoid))((a: A) => newConst(f(a)))(data).getConst;

export const folded: <F, A, M>(f: Foldable<F>, monoid: Monoid<M>) => Fold<Get1<F, A>, A, M> =
    foldMap;
