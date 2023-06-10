import type { Get1 } from "../hkt.js";
import type { Applicative } from "./applicative.js";
import type { Foldable } from "./foldable.js";
import type { Functor } from "./functor.js";
import type { Monad } from "./monad.js";

/**
 * A structure which can be traversed to the structure of same shape by performing `Applicative` action.
 */
export interface Traversable<T> extends Functor<T>, Foldable<T> {
    /**
     * Maps each item of the structure `data` to an action, and evaluates them from left to right, then collects the result.
     *
     * @param app - The instance of `Applicative` for `F`.
     * @param visitor - The visitor function, which takes an item and returns the action on `F`.
     * @param data - The data to be traversed.
     * @returns The collected result of actions.
     */
    readonly traverse: <F>(
        app: Applicative<F>,
    ) => <A, B>(visitor: (a: A) => Get1<F, B>) => (data: Get1<T, A>) => Get1<F, Get1<T, B>>;
}

/**
 * Evaluates actions of the structure `data` from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param app - The instance of `Applicative` for `F`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const sequenceA = <T, F, A>(
    traversable: Traversable<T>,
    app: Applicative<F>,
): ((data: Get1<T, Get1<F, A>>) => Get1<F, Get1<T, A>>) => traversable.traverse<F>(app)((x) => x);

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param visitor - The visitor function, which takes an item and returns the action on `M`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const mapM = <T, M, A, B>(
    traversable: Traversable<T>,
    monad: Monad<M>,
): ((visitor: (a: A) => Get1<M, B>) => (data: Get1<T, A>) => Get1<M, Get1<T, B>>) =>
    traversable.traverse(monad);

/**
 * Evaluates monadic actions of the structure `data` from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const sequence = <T, M, A>(
    traversable: Traversable<T>,
    monad: Monad<M>,
): ((data: Get1<T, Get1<M, A>>) => Get1<M, Get1<T, A>>) => sequenceA(traversable, monad);
