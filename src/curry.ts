type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

export type Curried<F> = F extends (...args: infer A) => infer R
    ? Equal<F, () => R> extends true
        ? () => R
        : A extends [infer F, ...infer S]
        ? (arg: F) => Curried<(...rest: S) => R>
        : R
    : never;

export function curry<F extends (...args: any[]) => unknown>(fn: F): Curried<F> {
    if (fn.length === 0) {
        return (() => fn()) as Curried<F>;
    }
    const curried =
        (fn: F, ...argStack: unknown[]) =>
        (newArg: unknown) => {
            const totalArgs = [...argStack, newArg];
            if (fn.length <= totalArgs.length) {
                return fn(...totalArgs);
            }
            return curried(fn, ...totalArgs);
        };
    return curried(fn) as Curried<F>;
}
