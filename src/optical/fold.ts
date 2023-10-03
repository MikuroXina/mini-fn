import { applicative, type ConstHkt, newConst } from "../const.js";
import type { Apply2Only, Get1 } from "../hkt.js";
import { appendToHead, empty, type List } from "../list.js";
import type { Optical } from "../optical.js";
import { isNone, type Option } from "../option.js";
import { getSwapped, newSwapped, type Swapped } from "../swapped.js";
import type { Tuple } from "../tuple.js";
import { Endo } from "../type-class.js";
import { type Applicative, noEffect } from "../type-class/applicative.js";
import { type Apply, apSecond } from "../type-class/apply.js";
import { type Foldable, traverse } from "../type-class/foldable.js";
import type { Monoid } from "../type-class/monoid.js";
import type { Traversable } from "../type-class/traversable.js";
import { type Contravariant, phantom } from "../type-class/variance.js";

export interface Fold<F, S, A> {
    (over: (a: A) => Get1<F, A>): (s: S) => Get1<F, S>;
}

/**
 * Creates a `Fold` from `folder` which returns a `Foldable`.
 *
 * @param f - The instance of `Foldable`.
 * @param contra - The instance of `Contravariant`.
 * @param app - The instance of `Applicative`.
 * @param folder - The function which returns a `Foldable` structure.
 * @returns The `Fold` instance.
 */
export const folding =
    <F>(f: Foldable<F>, contra: Contravariant<F>, app: Applicative<F>) =>
    <S, A>(folder: (s: S) => Get1<F, A>): Fold<F, S, A> =>
    (over) =>
    (s) =>
        phantom(app, contra)(traverse(f, app)(over)(folder(s)));

/**
 * Creates a `Fold` from `folder` which behaves like `foldR`.
 *
 * @param contra - The instance of `Contravariant`.
 * @param app - The instance of `Applicative`.
 * @param fr - The function which behaves like `foldR`.
 * @returns The `Fold` instance, but more generic.
 */
export const foldingR =
    <F>(contra: Contravariant<F>, app: Applicative<F>) =>
    <S, T, A, B>(
        fr: (
            folder: (a: A) => (fa: Get1<F, A>) => Get1<F, A>,
        ) => (fa: Get1<F, A>) => (s: S) => Get1<F, A>,
    ): Optical<S, Get1<F, T>, A, Get1<F, B>> =>
    (next) =>
    (s) =>
        phantom(
            app,
            contra,
        )(fr((a) => (fa) => apSecond(app)(next(a))(fa))(noEffect(app, contra))(s));

/**
 * Creates an infinite repeater optic for `Apply`.
 *
 * @param app - The instance of `Apply`.
 * @returns The infinite repeating optic.
 */
export const repeated =
    <F>(app: Apply<F>) =>
    <A>(f: (a: A) => Get1<F, A>) =>
    (a: A): Get1<F, A> => {
        const as = (): Get1<F, A> => apSecond(app)(f(a))(as());
        return as();
    };

/**
 * Creates an repeater that replicates its input by `count` times.
 *
 * @param contra - The instance of `Contravariant`.
 * @param app - The instance of `Applicative`.
 * @param count - The count to repeat.
 * @returns The repeating optic.
 */
export const replicated =
    <F>(contra: Contravariant<F>, app: Applicative<F>) =>
    <A>(count: number): Fold<F, A, A> =>
    (f) =>
    (a) => {
        const m = f(a);
        const go = (n: number): Get1<F, A> => {
            if (n == 0) {
                return noEffect<F, A>(app, contra);
            }
            return apSecond(app)(m)(go(n - 1));
        };
        return go(count);
    };

/**
 * Transform a `Fold`-like optical into another one which loops over its input.
 *
 * @param app - The instance for `Apply`.
 * @param lens - The source optical.
 * @returns The transformed optical.
 */
export const cycled =
    <F>(app: Apply<F>) =>
    <S, T, A, B>(
        lens: Optical<S, Get1<F, T>, A, Get1<F, B>>,
    ): Optical<S, Get1<F, T>, A, Get1<F, B>> =>
    (f) =>
    (a) => {
        const as = (): Get1<F, T> => apSecond(app)(lens(f)(a))(as());
        return as();
    };

/**
 * Creates a `Fold` that unfolds `B` into `A`s.
 *
 * @param contra - The instance of `Contravariant`.
 * @param app - The instance of `Applicative`.
 * @param unfolder - The function which decomposes `B` into `[A, B]`.
 * @returns The instance of `Fold`
 */
export const unfolded =
    <F>(contra: Contravariant<F>, app: Applicative<F>) =>
    <B, A>(unfolder: (data: B) => Option<Tuple<A, B>>): Fold<F, B, A> =>
    (f) => {
        const go = (b: B): Get1<F, B> => {
            const ab = unfolder(b);
            if (isNone(ab)) {
                return noEffect(app, contra);
            }
            const [a, nextB] = ab[1];
            return apSecond(app)(f(a))(go(nextB));
        };
        return go;
    };

/**
 * Creates an infinite `Fold`-like optical which iterates data by applying `succ`.
 *
 * @param app - The instance of `Apply`.
 * @param succ - The function to generate a next item.
 * @returns The iterating optic.
 */
export const iterated =
    <F>(app: Apply<F>) =>
    <A>(succ: (a: A) => A): Optical<A, Get1<F, A>, A, Get1<F, A>> =>
    (next) => {
        const go = (a: A): Get1<F, A> => apSecond(app)(next(a))(go(succ(a)));
        return go;
    };

// getting:

export type Getting<R, S, A> = Fold<Apply2Only<ConstHkt, R>, S, A>;

/**
 * Creates a new `Getting` from function. It is equivalent to an identity function.
 */
export const folds =
    <S, A, M>(l: (over: (a: A) => M) => (s: S) => M): Getting<M, S, A> =>
    (over) =>
    (s) =>
        newConst(l((a) => over(a).getConst)(s));

export const boo =
    <T, A, M>(tra: Traversable<T>, monoid: Monoid<M>): Getting<M, Get1<T, A>, A> =>
    (f) =>
    (data) =>
        tra.traverse(applicative(monoid))((a: A) => f(a))(data);

/**
 * Maps each focused entry of a data structure.
 *
 * @param lens - The focused view.
 * @param view - The function to extract data as a view.
 * @param data - The data to be extracted.
 * @returns The transformed data.
 */
export const foldMapOf =
    <R, S, A>(lens: Getting<R, S, A>) =>
    (view: (a: A) => R) =>
    (data: S): R =>
        lens((a) => newConst(view(a)))(data).getConst;

/**
 * Combines elements of a data structure through an optic.
 *
 * @param lens - The lens view.
 * @param data - The data to be combined.
 * @returns The obtained data from elements.
 */
export const foldOf =
    <S, A>(lens: Getting<A, S, A>) =>
    (data: S): A =>
        lens(newConst)(data).getConst;

/**
 * Combines elements of a data structure through an optic with right-associative `folder`.
 *
 * @param lens - The lens view.
 * @param folder - The function to fold data.
 * @param init - The initial item to start folding.
 * @param data - The state to be combined.
 * @returns The obtained data from elements.
 */
export const foldOfR =
    <R, S, A>(lens: Getting<Endo.Endo<R>, S, A>) =>
    (folder: (item: A) => (state: R) => R) =>
    (init: R) =>
    (data: S): R =>
        foldMapOf<Endo.Endo<R>, S, A>(lens)(folder)(data)(init);

/**
 * Combines elements of a data structure through an optic with left-associative `folder`.
 *
 * @param lens - The lens view.
 * @param folder - The function to fold data.
 * @param init - The initial item to start folding.
 * @param data - The state to be combined.
 * @returns The obtained data from elements.
 */
export const foldOfL =
    <R, S, A>(lens: Getting<Swapped<Endo.Endo<R>>, S, A>) =>
    (folder: (state: R) => (item: A) => R) =>
    (init: R) =>
    (data: S): R =>
        getSwapped(foldMapOf(lens)((a) => newSwapped((r: R) => folder(r)(a)))(data))(init);

/**
 * Extracts a list on focus.
 *
 * @param lens - The focused lens.
 * @returns The extraction operation.
 */
export const toListOf = <S, A>(lens: Getting<Endo.Endo<List<A>>, S, A>): ((s: S) => List<A>) =>
    foldOfR(lens)(appendToHead)(empty());
