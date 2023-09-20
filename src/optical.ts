import { absurd } from "./func.js";
import type { Setter } from "./optical/setter.js";
import { none, type Option, some } from "./option.js";

export * as Lens from "./optical/lens.js";
export * as Prism from "./optical/prism.js";
export * as Setter from "./optical/setter.js";

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
    readonly setWith: (setter: Setter<A, B>) => T;
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
        setWith: (setter) => o<T>((a) => (bt) => setter<T>(absurd)(a)(bt))(data)((t) => t),
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
