import type { Get2 } from "../hkt.js";
import type { Associative } from "./associative.js";
import type { Iso } from "./iso.js";

/**
 * All instance of `Tensor` must satisfy:
 *
 * - `forward(leftUnit())(a.compose(i)) == a`,
 * - `backward(leftUnit())(a) == a.compose(i)`,
 * - `forward(rightUnit())(i.compose(a)) == a`,
 * - `backward(rightUnit())(a) == i.compose(a)`.
 */
export interface Tensor<Cat, T, I> extends Associative<Cat, T> {
    readonly leftUnit: <A>() => Iso<Cat, Get2<T, I, A>, A>;
    readonly rightUnit: <A>() => Iso<Cat, Get2<T, A, I>, A>;
}
