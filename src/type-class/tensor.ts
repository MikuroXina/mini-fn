import type { Get2 } from "../hkt.ts";
import type { Associative } from "./associative.ts";
import type { Iso } from "./iso.ts";

/**
 * All instance of `Tensor` must satisfy:
 *
 * - `forward(leftUnit())(a.compose(i)) == a`,
 * - `backward(leftUnit())(a) == a.compose(i)`,
 * - `forward(rightUnit())(i.compose(a)) == a`,
 * - `backward(rightUnit())(a) == i.compose(a)`.
 */
export type Tensor<Cat, T, I> = Associative<Cat, T> & {
    readonly leftUnit: <A>() => Iso<Cat, Get2<T, I, A>, A>;
    readonly rightUnit: <A>() => Iso<Cat, Get2<T, A, I>, A>;
};
