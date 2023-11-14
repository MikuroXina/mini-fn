import { constant } from "../func.ts";
import type { Get1 } from "../hkt.ts";
import type { Invariant } from "./variance.ts";

/**
 * A structure which able to lift up in `F`.
 *
 * An instance of `Functor<F>` must satisfy following rules:
 *
 * - Identity: `map(id) == id`,
 * - Composition: for all `f` and `g`; `map(pipe(f)(g)) == pipe(map(f))(map(g))`.
 */
export interface Functor<F> {
    /**
     * Maps the function `fn` onto `F` structure.
     *
     * @param fn - The function to be mapped.
     * @returns The mapped function.
     */
    readonly map: <T, U>(fn: (t: T) => U) => (t: Get1<F, T>) => Get1<F, U>;
}

/**
 * Maps a function into the nested one with two functor instances.
 *
 * @param funcA - The instance of `Functor` for `FA`.
 * @param funcB - The instance of `Functor` for `FB`.
 * @param f - The mapper function.
 * @returns The nest-mapped function.
 */
export const map = <FA, FB>(funcA: Functor<FA>, funcB: Functor<FB>) =>
<T, U>(
    f: (t: T) => U,
): (funcT: Get1<FA, Get1<FB, T>>) => Get1<FA, Get1<FB, U>> =>
    funcA.map(funcB.map(f));

/**
 * @param func - The instance of `Functor` for `F`.
 * @param a - The value to be replaced.
 * @param fb - The target to replace.
 * @returns The replaced object of `F` contains the item `a`.
 */
export const replace =
    <F>(func: Functor<F>) => <A>(a: A): <B>(fb: Get1<F, B>) => Get1<F, A> =>
        func.map(constant(a));

/**
 * Applies the function in `S` to the item `t`, but flipped the arguments.
 *
 * @param func - The instance of `Functor` for `S`.
 * @param item - The item to be applied.
 * @param t - The function to apply.
 * @returns The applied item in `S`.
 */
export const flap = <S>(func: Functor<S>) => <T, U>(item: T) =>
    func.map((f: (argT: T) => U) => f(item));

/**
 * Binds the item in `S` to a new object with the provided key.
 *
 * @param func - The instance of `Functor` for `S`.
 * @param name - The property key to be bound.
 * @param t - The item in `S`.
 * @returns The bound object in `S`.
 */
export const bindTo =
    <S>(func: Functor<S>) => <N extends PropertyKey>(name: N) =>
        func.map(<T>(a: T) => ({ [name]: a }) as Record<N, T>);

/**
 * @param func - The instance of `Functor` for `S`.
 * @returns The instance of `Invariant` for `S` of `Functor`.
 */
export const functorAsInvariant = <S>(func: Functor<S>): Invariant<S> => ({
    inMap: (f) => () => func.map(f),
});
