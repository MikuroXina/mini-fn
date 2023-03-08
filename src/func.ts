import type { Apply2Only, Hkt2 } from "./hkt.js";
import type { Arrow } from "./type-class/arrow.js";
import type { Functor } from "./type-class/functor.js";
import type { Representable } from "./type-class/representable.js";

/**
 * The identity function which returns the passed value as is.
 */
export const id = <T>(x: T) => x;

/**
 * The constant function which returns the first passed value.
 */
export const constant =
    <T>(x: T) =>
    <U>(_u: U) =>
        x;

/**
 * Indicates the unreachable code path. Calling this throws an error immediately, so this function should be called only if your application data is not consistent.
 */
export const absurd = <T>(): T => {
    throw new Error("PANIC: absurd must not be called");
};

/**
 * Composes two functions sequentially. `z = pipe(a)(b)(x)` means `y = a(x), z = b(y)`.
 *
 * @param firstDo - The function to do at first.
 * @param secondDo - The function to do at last.
 * @returns The composed function.
 */
export const pipe =
    <T, U>(firstDo: (t: T) => U) =>
    <V>(secondDo: (u: U) => V) =>
    (t: T) =>
        secondDo(firstDo(t));

/**
 * Composes two functions mathematically. `compose(f)(g)(x)` means `f(g(x))`.
 *
 * @param f - The function to do at last.
 * @param g - The function to do at first.
 * @returns The composed function.
 */
export const compose =
    <U, V>(f: (u: U) => V) =>
    <T>(g: (t: T) => U) =>
    (t: T) =>
        f(g(t));

/**
 * Flips two arguments of the function.
 *
 * @param f - The function with two arguments.
 * @returns The function flipped the arguments.
 */
export const flip =
    <T, U, V>(f: (t: T) => (u: U) => V) =>
    (u: U) =>
    (t: T): V =>
        f(t)(u);

/**
 * Repeats the `succ` operation until `pred` returns `true`.
 *
 * @param pred - The predicate whether the operation is done.
 * @param succ - The recursion successor of the operation.
 * @param init - The initial term of the operation.
 * @returns The found value while operations.
 */
export const until =
    <T>(pred: (t: T) => boolean) =>
    (succ: (t: T) => T): ((init: T) => T) => {
        const go = (x: T): T => {
            if (pred(x)) {
                return x;
            }
            return go(succ(x));
        };
        return go;
    };

/**
 * The type of function from `A` to `B`.
 */
export interface Fn<A, B> {
    (a: A): B;
}

export interface FnHkt extends Hkt2 {
    readonly type: Fn<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Fn<E, _>`.
 */
export const functor = <E>(): Functor<Apply2Only<FnHkt, E>> => ({
    map: compose,
});

/**
 * The instance of `Representable` for `Fn<E, _>`.
 */
export const representable = <E>(): Representable<Apply2Only<FnHkt, E>, E> => ({
    map: compose,
    index: id,
    tabulate: id,
});

/**
 * The instance of `Arrow` for `Fn`. It is useful to construct the bifunctor with functions.
 */
export const fnArrow: Arrow<FnHkt> = {
    compose,
    identity: () => id,
    arr: id,
    split:
        (arrow1) =>
        (arrow2) =>
        ([b1, b2]) =>
            [arrow1(b1), arrow2(b2)],
};
