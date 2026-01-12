import { andMonoid, orMonoid } from "../bool.js";
import { compose, id } from "../func.js";
import type { Get1 } from "../hkt.js";
import { build, type List } from "../list.js";
import { isNone, none, type Option, some, unwrapOrElse } from "../option.js";
import type { Monad } from "./monad.js";
import { append, type Monoid } from "./monoid.js";
import type { PartialEq } from "./partial-eq.js";

/**
 * A structure which can be reduced to an accumulated value, such as list and tree.
 */
export type Foldable<T> = {
    /**
     * Folds the data structure with `folder` function by right associativity.
     *
     * @param folder - The function which takes the next and accumulating value and returns the calculated accumulation.
     * @param init - The initial value for `acc` of `folder`.
     * @param data - The data structure to be folded.
     * @returns The accumulated result value.
     */
    readonly foldR: <A, B>(
        folder: (next: A) => (acc: B) => B,
    ) => (init: B) => (data: Get1<T, A>) => B;
};

/**
 * Maps data in the structure `T` into the monoid `M` and folds them with `monoid.combine`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param monoid - The instance of `Monoid` for `M`.
 * @param f - The function which maps from data `A` to the monoid `M`.
 * @param ta - The data structure to be folded.
 * @returns The combined result value.
 */
export const foldMap =
    <T, A, M>(foldable: Foldable<T>, monoid: Monoid<M>) =>
    (f: (t: A) => M): ((ta: Get1<T, A>) => M) =>
        foldable.foldR<A, M>(compose(append(monoid))(f))(monoid.identity);

/**
 * Folds data of the monoid `M` in the structure `T` with `monoid.combine`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param monoid - The instance of `Monoid` for `M`.
 * @param tm - The data structure to be folded.
 * @returns The combined result value.
 */
export const fold = <T, M>(
    foldable: Foldable<T>,
    monoid: Monoid<M>,
): ((tm: Get1<T, M>) => M) => foldMap<T, M, M>(foldable, monoid)(id);

/**
 * Folds the data structure with `folder` function by left associativity.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param folder - The function which takes the next and accumulating value and returns the calculated accumulation.
 * @param init - The initial value for `acc` of `folder`.
 * @param data - The data structure to be folded.
 * @returns The accumulated result value.
 */
export const foldL =
    <T>(foldable: Foldable<T>) =>
    <A, B>(folder: (b: B) => (a: A) => B) =>
    (init: B) =>
    (data: Get1<T, A>): B =>
        foldable.foldR((x: A) => (k: (b: B) => B) => (z: B) => k(folder(z)(x)))(
            id,
        )(data)(init);

/**
 * Folds the data structure with `folder` function by right associativity. The last value will be used as an initial value for `acc` of `folder`, or throws an error if no exists.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param folder - The function which takes the next and accumulating value and returns the calculated accumulation.
 * @param data - The data structure to be folded.
 * @returns The accumulated result value.
 */
export const foldR1 =
    <T>(foldable: Foldable<T>) =>
    <A>(folder: (l: A) => (r: A) => A) =>
    (data: Get1<T, A>): A => {
        const mf =
            (x: A) =>
            (m: Option<A>): Option<A> => {
                if (isNone(m)) {
                    return some(x);
                }
                return some(folder(x)(m[1]));
            };
        return unwrapOrElse<A>(() => {
            throw new Error("foldR1: empty structure");
        })(foldable.foldR(mf)(none())(data));
    };

/**
 * Folds the data structure with `folder` function by left associativity. The first value will be used as an initial value for `acc` of `folder`, or throws an error if no exists.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param folder - The function which takes the next and accumulating value and returns the calculated accumulation.
 * @param data - The data structure to be folded.
 * @returns The accumulated result value.
 */
export const foldL1 =
    <T>(foldable: Foldable<T>) =>
    <A>(f: (l: A) => (r: A) => A) =>
    (data: Get1<T, A>): A => {
        const mf =
            (m: Option<A>) =>
            (y: A): Option<A> => {
                if (isNone(m)) {
                    return some(y);
                }
                return some(f(m[1])(y));
            };
        return unwrapOrElse<A>(() => {
            throw new Error("foldL1: empty structure");
        })(foldL(foldable)(mf)(none())(data));
    };

/**
 * Converts the foldable data into a list.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param data - The data structure to be converted.
 * @returns The converted list.
 */
export const toList =
    <T>(foldable: Foldable<T>) =>
    <A>(data: Get1<T, A>): List<A> =>
        build(
            <B>(c: (a: A) => (b: B) => B) =>
                (n: B) =>
                    foldable.foldR(c)(n)(data),
        );

/**
 * Checks whether the data structure has no elements.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param ta - The data to be checked.
 * @returns Whether the data structure has no elements.
 */
export const isNull = <T, A>(
    foldable: Foldable<T>,
): ((ta: Get1<T, A>) => boolean) =>
    foldable.foldR<A, boolean>(() => () => false)(true);

/**
 * Counts items in the data structure.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param ta - The data to be counted.
 * @returns The length of data.
 */
export const length = <T, A>(
    foldable: Foldable<T>,
): ((ta: Get1<T, A>) => number) =>
    foldL(foldable)<A, number>((c: number) => () => c + 1)(0);

/**
 * Tests whether all items in the data is `true`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param data - The data to be tested.
 * @returns The test result.
 */
export const and = <T>(
    foldable: Foldable<T>,
): ((data: Get1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a && b)(true);

/**
 * Tests whether all items in the data satisfy the predicate `pred`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param pred - The condition of test.
 * @param data - The data to be tested.
 * @returns The test result.
 */
export const all =
    <T>(foldable: Foldable<T>) =>
    <A>(pred: (a: A) => boolean): ((data: Get1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, andMonoid)(pred);

/**
 * Tests whether at least one item in the data is `true`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param data - The data to be tested.
 * @returns The test result.
 */
export const or = <T>(
    foldable: Foldable<T>,
): ((data: Get1<T, boolean>) => boolean) =>
    foldable.foldR((a: boolean) => (b: boolean) => a || b)(false);

/**
 * Tests whether at least one item in the data satisfy the predicate `pred`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param pred - The condition of test.
 * @param data - The data to be tested.
 * @returns The test result.
 */
export const any =
    <T>(foldable: Foldable<T>) =>
    <A>(pref: (a: A) => boolean): ((data: Get1<T, A>) => boolean) =>
        foldMap<T, A, boolean>(foldable, orMonoid)(pref);

/**
 * Checks whether there is value in the data where equals to `target`.
 *
 * @param foldable - The instance of `Foldable` for `T`.
 * @param eq - The instance of equality for `A`.
 * @param target - The value to find from there.
 * @param data - The data to be searched.
 * @returns Whether the value is there.
 */
export const contains = <T, A>(
    foldable: Foldable<T>,
    eq: PartialEq<A>,
): ((target: A) => (data: Get1<T, A>) => boolean) =>
    compose<(a: A) => boolean, (list: Get1<T, A>) => boolean>(any(foldable))(
        (l: A) => (r: A) => eq.eq(l, r),
    );

/**
 * Maps each item of the structure `data` to a monadic action, and evaluates them from left to right, then ignores the result.
 *
 * @param foldable - A `Foldable` instance for `T`.
 * @param monad - A `Monad` instance for `M`.
 * @param visitor - A visitor function, which takes an item and returns the action on `M`.
 * @param data - Data to be traversed.
 * @returns The collected result of actions.
 */
export const mapMIgnore =
    <T, M>(foldable: Foldable<T>, monad: Monad<M>) =>
    <A, B>(
        visitor: (a: A) => Get1<M, B>,
    ): ((data: Get1<T, A>) => Get1<M, never[]>) =>
        foldable.foldR(
            (x: A) => (k: Get1<M, never[]>) =>
                monad.flatMap<B, never[]>(() => k)(visitor(x)),
        )(monad.pure([]));
