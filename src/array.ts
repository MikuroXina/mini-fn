import type { Get1, Hkt1 } from "./hkt.js";
import { type Applicative, liftA2 } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { Reduce } from "./type-class/reduce.js";
import type { Traversable } from "./type-class/traversable.js";

export interface ArrayHkt extends Hkt1 {
    readonly type: readonly this["arg1"][];
}

export const foldR: <A, B>(
    folder: (next: A) => (acc: B) => B,
) => (init: B) => (data: readonly A[]) => B = (folder) => (init) => (data) =>
    data.reduceRight((prev, curr) => folder(curr)(prev), init);

export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (data: readonly A[]): Get1<F, readonly B[]> => {
        let res = app.pure([] as readonly B[]);
        for (const a of data) {
            res = liftA2(app)((b: B) => (bs: readonly B[]) => [b, ...bs])(visitor(a))(res);
        }
        return res;
    };

export const functor: Functor<ArrayHkt> = {
    map: (fn) => (t) => t.map(fn),
};

export const monad: Monad<ArrayHkt> = {
    map: (fn) => (t) => t.map(fn),
    pure: (t) => [t],
    apply: (fns) => (ts) => fns.flatMap((fn) => ts.map((t) => fn(t))),
    flatMap: (fn) => (t) => t.flatMap(fn),
};

export const traversable: Traversable<ArrayHkt> = {
    ...functor,
    foldR,
    traverse,
};

/**
 * Crates a new array from elements in `fa`.
 *
 * @param reduce - The instance of `Reduce` for `F`.
 * @param fa - The container having elements of `A`.
 * @returns The new array.
 */
export const fromReduce =
    <F>(reduce: Reduce<F>) =>
    <A>(fa: Get1<F, A>): ReadonlyArray<A> =>
        reduce.reduceL((arr: A[]) => (elem: A) => [...arr, elem])([])(fa);

/**
 * Reduces the elements of array by `reducer` from right-side.
 *
 * @param reducer - The reducer called with `A` and `B`.
 * @param fa - The array to be folded.
 * @returns The folded value.
 */
export const reduceR: <A, B>(reducer: (a: A) => (b: B) => B) => (fa: readonly A[]) => (b: B) => B =
    (reducer) => (as) => (b) => {
        const reversed = [...as].reverse();
        for (const a of reversed) {
            b = reducer(a)(b);
        }
        return b;
    };
/**
 * Reduces the elements of array by `reducer` from left-side.
 *
 * @param reducer - The reducer called with `B` and `A`.
 * @param fa - The array to be folded.
 * @returns The folded value.
 */
export const reduceL: <A, B>(reducer: (b: B) => (a: A) => B) => (b: B) => (fa: readonly A[]) => B =
    (reducer) => (b) => (as) =>
        as.reduce((acc, a) => reducer(acc)(a), b);

/**
 * The instance of `Reduce` for `Array`.
 */
export const reduce: Reduce<ArrayHkt> = {
    reduceR,
    reduceL,
};
