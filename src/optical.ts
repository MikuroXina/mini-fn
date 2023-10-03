import { absurd } from "./func.js";
import type { Setter } from "./optical/setter.js";
import { none, type Option, some } from "./option.js";

export * as Fold from "./optical/fold.js";
export * as Getter from "./optical/getter.js";
export * as Lens from "./optical/lens.js";
export * as Prism from "./optical/prism.js";
export * as Setter from "./optical/setter.js";
export * as Traversal from "./optical/traversal.js";

export type Optical<in S, out T, out A, in B> = (next: (sending: A) => B) => (received: S) => T;
export type OpticalSimple<S, A> = Optical<S, S, A, A>;

/**
 * Computation combinator with two-terminal pair.
 * ```text
 *     |---------------|
 * S ->|               |-> A
 *     |  Computation  |
 * T <-|               |<- B
 *     |---------------|
 * ```
 */
export type Optic<in S, out T, out A, in B> = <R>(
    next: (sending: A) => (continuation: (returned: B) => R) => R,
) => (received: S) => (callback: (t: T) => R) => R;
export type OpticSimple<S, A> = Optic<S, S, A, A>;

/**
 * The identity combinator which does nothing.
 */
export const identity =
    <S>(): Optic<S, S, S, S> =>
    (x) =>
        x;

/**
 * Composes two computations.
 * ```text
 *     |--------|       |---------|
 * X ->|        |-> S ->|         |-> A
 *     |  left  |       |  right  |
 * Y <-|        |<- T <-|         |<- B
 *     |--------|       |---------|
 * ```
 *
 * @param left - The second process.
 * @param right - The first process.
 * @returns The composed computation.
 */
export const compose =
    <X, Y, S, T>(left: Optic<X, Y, S, T>) =>
    <A, B>(right: Optic<S, T, A, B>): Optic<X, Y, A, B> =>
    (ab) =>
        left(right(ab));

/**
 * Modifies the value of the focused entry.
 */
export const over =
    <S, T, A, B>(lens: Optic<S, T, A, B>) =>
    (modifier: (a: A) => B) =>
    (data: S): T =>
        lens<T>((a) => (br) => br(modifier(a)))(data)((t) => t);

/**
 * Overwrites the value of the focused entry.
 */
export const set =
    <S, T, A, B>(lens: Optic<S, T, A, B>) =>
    (value: B) =>
    (data: S): T =>
        over(lens)(() => value)(data);

/**
 * Extracts the value of the focused entry.
 */
export const get =
    <S, T, A, B>(lens: Optic<S, T, A, B>) =>
    (data: S): Option<A> =>
        lens<Option<A>>((a) => () => some(a))(data)(none);

/**
 * Extracts the value of the focused entry, or throw an error if no entry found.
 */
export const unwrap =
    <S, T, A, B>(lens: Optic<S, T, A, B>) =>
    (data: S): A =>
        lens<A>((a) => () => a)(data)(() => {
            throw new Error("no entry");
        });

export interface OpticCat<S, T, A, B> {
    /**
     * Feeds the `Optic` and produces a new environment.
     *
     * @param o - The computation such as `Lens`, `Prism` and so on.
     * @returns Modified environment.
     */
    readonly feed: <X, Y>(o: Optic<A, B, X, Y>) => OpticCat<S, T, X, Y>;
    /**
     * Modifies the value of the focused entry.
     *
     * @param modifier - The function which maps from the entry value to you desired.
     * @returns Whole of data with the entry modified.
     */
    readonly over: (modifier: (a: A) => B) => T;
    /**
     * Overwrites the value of the focused entry.
     *
     * @param value - The value to be placed.
     * @returns Whole of data with `value`.
     */
    readonly set: (value: B) => T;
    /**
     * Overwrites the value with the modifying computation.
     *
     * @param setter - The finish computation to add.
     * @returns Whole of data with `setter`.
     */
    readonly setWith: <X, Y>(setter: Setter<A, B, X, Y>) => T;
    /**
     * Extracts the value of the focused entry.
     *
     * @returns Extracted value if exists.
     */
    readonly get: () => Option<A>;
    /**
     * Extracts the value of the focused entry, or throws an error if not found.
     *
     * @returns Extracted value.
     */
    readonly unwrap: () => A;
}

/**
 * Creates a focused environment to compute about the part of the data structure.
 *
 * @param data - The data to be computed.
 * @param o - The computation to use.
 * @returns The modified environment.
 */
export const focused =
    <S>(data: S) =>
    <T, A, B>(o: Optic<S, T, A, B>): OpticCat<S, T, A, B> => ({
        feed: (right) => focused(data)(compose(o)(right)),
        over: (modifier) => o<T>((a) => (br) => br(modifier(a)))(data)((t) => t),
        set: (value) => o<T>(() => (br) => br(value))(data)((t) => t),
        setWith: (setter) => o<T>((a) => (bt) => bt(setter(absurd)(a)))(data)((t) => t),
        get: () => o<Option<A>>((a) => () => some(a))(data)(none),
        unwrap: () =>
            o<A>((a) => () => a)(data)(() => {
                throw new Error("no entry");
            }),
    });

/**
 * Creates an environment to compute about the data structure.
 *
 * @param data - The data to be computed.
 * @returns The environment to compute.
 */
export const opticCat = <S>(data: S): OpticCat<S, S, S, S> => focused(data)(identity());

export interface OverCat<A, B> {
    readonly on: <S, T>(o: Optic<S, T, A, B>) => OverCat<S, T>;
    readonly from: (source: A) => B;
}

export const overCat = <A, B>(modifier: (a: A) => B): OverCat<A, B> => ({
    on: <S, T>(o: Optic<S, T, A, B>) =>
        overCat((s: S) => o<T>((a) => (bt) => bt(modifier(a)))(s)((t) => t)),
    from: modifier,
});
