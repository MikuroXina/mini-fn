import type { Get2 } from "../hkt.js";
import type { SemiGroupoid } from "./semi-groupoid.js";

/**
 * A 2-arity kind which consists of objects and arrows between them.
 *
 * All instances of category `c` must satisfy the following laws:
 *
 * - Right identity: For all `f`; `c.compose(f)(c.identity())` equals to `f`,
 * - Left identity: For all `f`; `c.compose(c.identity())(f)` equals to `f`,
 * - Associativity: For all `f`, `g` and `h`; `c.compose(f)(c.compose(g)(h))` equals to `c.compose(c.compose(f)(g))(h)`.
 */
export type Category<S> = SemiGroupoid<S> & {
    readonly identity: <A>() => Get2<S, A, A>;
};

export const compose = <S>(
    cat: Category<S>,
): (<B, C>(bc: Get2<S, B, C>) => <A>(ab: Get2<S, A, B>) => Get2<S, A, C>) =>
    cat.compose;

export const pipe =
    <S>(cat: Category<S>) =>
    <A, B>(bc: Get2<S, A, B>) =>
    <C>(ab: Get2<S, B, C>): Get2<S, A, C> =>
        cat.compose(ab)(bc);
