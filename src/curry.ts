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
