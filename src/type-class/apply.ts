import { pipe } from "../func.ts";
import type { Get1 } from "../hkt.ts";
import type { Functor } from "./functor.ts";
import { type SemiGroup, semiGroupSymbol } from "./semi-group.ts";

/**
 * A structure which able to evaluate a function over `S`.
 */
export interface Apply<S> extends Functor<S> {
    /**
     * Applies the function to the value over `S`.
     *
     * @param fn - The wrapped function.
     * @param t - The wrapped value.
     * @returns The value got by evaluating `fn`.
     */
    readonly apply: <T, U>(
        fn: Get1<S, (t: T) => U>,
    ) => (t: Get1<S, T>) => Get1<S, U>;
}

/**
 * Sequences two computations over two functors.
 *
 * @param applyA - The `Apply` instance for `SA`.
 * @param applyB - The `Apply` instance for `SB`.
 * @param first - The first computation to be sequenced.
 * @param second - The second computation to be sequenced.
 * @returns The sequenced computation, doing `first` then `second`.
 */
export const ap =
    <SA, SB>(applyA: Apply<SA>, applyB: Apply<SB>) =>
    <T>(funcT: Get1<SA, Get1<SB, T>>) =>
    <U>(funcM: Get1<SA, Get1<SB, (t: T) => U>>): Get1<SA, Get1<SB, U>> =>
        applyA.apply(applyA.map(applyB.apply)(funcM))(funcT);

/**
 * Sequences two computations, discarding the result of `second`.
 *
 * @param apply - The `Apply` instance for `S`.
 * @param first - The first computation to be sequenced.
 * @param second - The second computation to be sequenced.
 * @returns The sequenced computation, doing `first` then `second`.
 */
export const apFirst =
    <S>(apply: Apply<S>) =>
    <T>(first: Get1<S, T>): <U>(second: Get1<S, U>) => Get1<S, T> =>
        apply.apply(apply.map((t: T) => () => t)(first));

/**
 * Sequences two computations, discarding the result of `first`.
 *
 * @param apply - The `Apply` instance for `S`.
 * @param first - The first computation to be sequenced.
 * @param second - The second computation to be sequenced.
 * @returns The sequenced computation, doing `first` then `second`.
 */
export const apSecond =
    <S>(apply: Apply<S>) =>
    <T>(first: Get1<S, T>): <U>(second: Get1<S, U>) => Get1<S, U> =>
        apply.apply(
            apply.map(
                () => <U>(u: U) => u,
            )(first),
        );

/**
 * Sequences two computations, composing the results of them.
 *
 * @param apply - The `Apply` instance for `S`.
 * @param name - The object key to pick up.
 * @param funcT - The computation resulting `T`.
 * @param funcU - The computation resulting `U`.
 * @returns The composed computation resulting object `T` with an entry of type `U` by `name` key.
 */
export const apSelective =
    <S>(apply: Apply<S>) =>
    <N extends PropertyKey, T>(name: Exclude<N, keyof T>) =>
    (
        funcT: Get1<S, T>,
    ): <U>(
        funcU: Get1<S, U>,
    ) => Get1<S, { [K in keyof T | N]: K extends keyof T ? T[K] : U }> =>
        apply.apply(
            apply.map(
                (t: T) => <U>(u: U) =>
                    ({ ...t, [name]: u }) as {
                        [K in keyof T | N]: K extends keyof T ? T[K] : U;
                    },
            )(funcT),
        );

/**
 * Lifts up the two-parameter function over `F`.
 *
 * @param app - The `Apply` instance for `F`.
 * @param f - The function which takes two parameters.
 * @returns The function lifted over `F`.
 */
export const map2 = <F>(app: Apply<F>) =>
<A, B, C>(
    f: (a: A) => (b: B) => C,
): (fa: Get1<F, A>) => (fb: Get1<F, B>) => Get1<F, C> =>
    pipe(app.map(f))(app.apply);

/**
 * Lifts up the semi-group instance over the apply functor.
 *
 * @param apply - The `Apply` instance for `S`.
 * @param semi - The `SemiGroup` instance for `T`.
 * @returns The lifted `SemiGroup` instance.
 */
export const makeSemiGroup =
    <S>(apply: Apply<S>) => <T>(semi: SemiGroup<T>): SemiGroup<Get1<S, T>> => ({
        combine: (l, r) =>
            apply.apply(
                apply.map((left: T) => (right: T) => semi.combine(left, right))(
                    l,
                ),
            )(r),
        [semiGroupSymbol]: true,
    });
