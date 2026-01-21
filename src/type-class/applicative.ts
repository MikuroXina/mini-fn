import { pipe } from "../func.js";
import type { Get1 } from "../hkt.js";
import { type Apply, makeSemiGroup } from "./apply.js";
import type { Monoid } from "./monoid.js";
import type { Pure } from "./pure.js";
import { semiGroupSymbol } from "./semi-group.js";

/**
 * A functor with application. It can combine sequence computations with `apply` or `liftA2` function.
 *
 * All instances of the applicative `a` must satisfy the following laws:
 *
 * - Identity: For all `x`; `a.apply(a.pure((i) => i))(x)` equals to `x`,
 * - Composition: For all `x`, `y` and `z`; `a.apply(a.apply(a.apply(a.pure((f) => (g) => (i) => f(g(i))))(x))(y))(z)` equals to `a.apply(x)(a.apply(y)(z))`,
 * - Homomorphism: For all `f` and `x`; `a.apply(a.pure(f))(a.pure(x))` equals to `a.pure(f(x))`,
 * - Interchange: For all `f` and `x`; `a.apply(f)(a.pure(x))` equals to `a.apply(a.pure((i) => i(x)))(f)`.
 */
export type Applicative<S> = Apply<S> & Pure<S>;

export const makeMonoid = <S>(
    app: Applicative<S>,
): (<T>(m: Monoid<T>) => Monoid<Get1<S, T>>) => {
    const semi = makeSemiGroup(app);
    return <T>(m: Monoid<T>): Monoid<Get1<S, T>> => ({
        combine: semi(m).combine,
        identity: app.pure(m.identity),
        [semiGroupSymbol]: true,
    });
};

export const liftA2 =
    <S>(app: Applicative<S>) =>
    <A, B, C>(
        f: (a: A) => (b: B) => C,
    ): ((x: Get1<S, A>) => (y: Get1<S, B>) => Get1<S, C>) =>
        pipe(app.map(f))(app.apply);

export const when =
    <F>(app: Applicative<F>) =>
    (cond: boolean) =>
    (op: Get1<F, never[]>): Get1<F, never[]> =>
        cond ? op : app.pure([]);
export const unless =
    <F>(app: Applicative<F>) =>
    (cond: boolean) =>
    (op: Get1<F, never[]>): Get1<F, never[]> =>
        cond ? app.pure([]) : op;
