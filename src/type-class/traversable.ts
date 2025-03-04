import type { Get1 } from "../hkt.ts";
import type { Applicative } from "./applicative.ts";
import { apSecond } from "./apply.ts";
import type { Foldable } from "./foldable.ts";
import type { Functor } from "./functor.ts";
import type { Monad } from "./monad.ts";

/**
 * A structure which can be traversed to the structure of same shape by performing `Applicative` action.
 *
 * All instances of the traversable functor `tra` must satisfy the following laws:
 *
 * - Naturality: For all `t`, `f` and `x`; `t(tra.traverse(app1)(f)(x))` equals to `tra.traverse(app2)((item) => t(f(item)))(x)`, where `app1` and `app2` are appropriate applicative functors about `f` and `t` respectively,
 * - Identity: For all x; `tra.traverse(Identity.applicative)((a) => a)(x)` equals to `x`,
 * - Composition: For all `f`, `g`, `x` and composed applicative functor `app` for `Compose<F, G, _>`; `tra.traverse(app)((item) => app.map(g)(f(item)))(x)` equals to `app.map(tra.traverse(app)(g))(tra.traverse(app)(f)(x))`.
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
    ) => <A, B>(
        visitor: (a: A) => Get1<F, B>,
    ) => (data: Get1<T, A>) => Get1<F, Get1<T, B>>;
}

/**
 * Evaluates actions of the structure `data` from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param app - The instance of `Applicative` for `F`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const sequenceA = <T, F>(
    traversable: Traversable<T>,
    app: Applicative<F>,
): <A>(data: Get1<T, Get1<F, A>>) => Get1<F, Get1<T, A>> =>
    traversable.traverse<F>(app)((x) => x);

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param visitor - The visitor function, which takes an item and returns the action on `M`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const mapM = <T, M>(
    traversable: Traversable<T>,
    monad: Monad<M>,
) =>
<A, B>(
    visitor: (a: A) => Get1<M, B>,
) =>
(data: Get1<T, A>): Get1<M, Get1<T, B>> =>
    traversable.traverse(monad)(visitor)(data);

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, but discards the results.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param visitor - The visitor function, which takes an item and returns the action on `M`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const mapMVoid =
    <T, M>(traversable: Traversable<T>, monad: Monad<M>) =>
    <A, B>(visitor: (a: A) => Get1<M, B>) =>
    (data: Get1<T, A>): Get1<M, never[]> =>
        traversable.foldR(
            (next: A) => (acc: Get1<M, never[]>): Get1<M, never[]> =>
                apSecond(monad)(visitor(next))(acc),
        )(monad.pure([]))(data);

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param data - The data to be traversed.
 * @param visitor - The visitor function, which takes an item and returns the action on `M`.
 * @returns The collected result of actions.
 */
export const forM = <T, M>(
    traversable: Traversable<T>,
    monad: Monad<M>,
) =>
<A>(data: Get1<T, A>) =>
<B>(
    visitor: (a: A) => Get1<M, B>,
): Get1<M, Get1<T, B>> => traversable.traverse(monad)(visitor)(data);

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, but discards the results.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param data - The data to be traversed.
 * @param visitor - The visitor function, which takes an item and returns the action on `M`.
 * @returns The collected result of actions.
 */
export const forMVoid =
    <T, M>(traversable: Traversable<T>, monad: Monad<M>) =>
    <A>(data: Get1<T, A>) =>
    <B>(visitor: (a: A) => Get1<M, B>): Get1<M, never[]> =>
        traversable.foldR(
            (next: A) => (acc: Get1<M, never[]>): Get1<M, never[]> =>
                apSecond(monad)(visitor(next))(acc),
        )(monad.pure([]))(data);

/**
 * Evaluates monadic actions of the structure `data` from left to right, then collects the result.
 *
 * @param traversable - The instance of `Traversable` for `T`.
 * @param monad - The instance of `Monad` for `M`.
 * @param data - The data to be traversed.
 * @returns The collected result of actions.
 */
export const sequence = <T, M>(
    traversable: Traversable<T>,
    monad: Monad<M>,
): <A>(data: Get1<T, Get1<M, A>>) => Get1<M, Get1<T, A>> =>
    sequenceA(traversable, monad);
