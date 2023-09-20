import { absurd } from "./func.js";
import type { Setter } from "./optical/setter.js";
import { none, type Option, some } from "./option.js";

export * as Lens from "./optical/lens.js";
export * as Prism from "./optical/prism.js";
export * as Setter from "./optical/setter.js";

export type Optic<in S, out T, out A, in B> = <R>(
    next: (sending: A) => (continuation: (returned: B) => R) => R,
) => (received: S) => (callback: (t: T) => R) => R;
export type OpticSimple<S, A> = Optic<S, S, A, A>;

export const identity =
    <S>(): Optic<S, S, S, S> =>
    (x) =>
        x;

export const compose =
    <S, T, A, B>(left: Optic<S, T, A, B>) =>
    <X, Y>(right: Optic<X, Y, S, T>): Optic<X, Y, A, B> =>
    (ab) =>
        right(left(ab));

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
    readonly feed: <X, Y>(o: Optic<A, B, X, Y>) => OpticCat<S, T, X, Y>;
    readonly over: (modifier: (a: A) => B) => T;
    readonly set: (value: B) => T;
    readonly setWith: (setter: Setter<A, B>) => T;
    readonly get: () => Option<A>;
    readonly unwrap: () => A;
}

export const focused =
    <S>(data: S) =>
    <T, A, B>(o: Optic<S, T, A, B>): OpticCat<S, T, A, B> => ({
        feed: (right) => focused(data)(compose(right)(o)),
        over: (modifier) => o<T>((a) => (br) => br(modifier(a)))(data)((t) => t),
        set: (value) => o<T>(() => (br) => br(value))(data)((t) => t),
        setWith: (setter) => o<T>((a) => (bt) => setter<T>(absurd)(a)(bt))(data)((t) => t),
        get: () => o<Option<A>>((a) => () => some(a))(data)(none),
        unwrap: () =>
            o<A>((a) => () => a)(data)(() => {
                throw new Error("no entry");
            }),
    });

export const opticCat = <S>(data: S): OpticCat<S, S, S, S> => ({
    feed: (o) => focused(data)(compose(o)(identity<S>())),
    over: (modifier) => modifier(data),
    set: (value) => value,
    setWith: (setter) => setter(() => () => data)(data)((s) => s),
    get: () => some(data),
    unwrap: () => data,
});
