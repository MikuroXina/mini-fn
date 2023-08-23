import { type FnHkt, representable as representableFn } from "./func.js";
import type { Apply2Only } from "./hkt.js";
import { functor as functorTuple, type TupleHkt } from "./tuple.js";
import type { Adjunction } from "./type-class/adjunction.js";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

/**
 * Curried form of the function type `F`.
 */
export type Curried<F> = F extends (...args: infer A) => infer R
    ? Equal<F, () => R> extends true
        ? () => R
        : A extends [infer A1, ...infer S]
        ? (arg: A1) => Curried<(...rest: S) => R>
        : R
    : never;

/**
 * Curries the n-ary function.
 *
 * @param fn - The function to be curried.
 * @returns The curried function.
 */
export function curry<F extends (...args: unknown[]) => unknown>(fn: F): Curried<F> {
    if (fn.length === 0) {
        return (() => fn()) as Curried<F>;
    }
    const curried =
        (target: F, ...argStack: unknown[]) =>
        (newArg: unknown) => {
            const totalArgs = [...argStack, newArg];
            if (target.length <= totalArgs.length) {
                return target(...totalArgs);
            }
            return curried(target, ...totalArgs);
        };
    return curried(fn) as Curried<F>;
}

/**
 * The instance of `Adjunction` for currying.
 */
export const curryAdjunction = <E>(): Adjunction<
    Apply2Only<TupleHkt, E>,
    Apply2Only<FnHkt, E>,
    E
> => ({
    functor: functorTuple(),
    representable: representableFn<E>(),
    unit: (a) => (e) => [e, a],
    counit: ([e, f]) => f(e),
});
