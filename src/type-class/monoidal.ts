import type { GenericSemiGroupal } from "./semi-groupal.ts";
import type { Tensor } from "./tensor.ts";
import type { Unital } from "./unital.ts";

/**
 * All instance of `Monoidal` must satisfy:
 *
 * - Right unitality: For all `x`; `combine(genericRightMap(introduce)(x)) == backward(rightUnit)(forward(rightUnit)(x))`,
 * - Left unitality: For all `x`; `combine(genericLeftMap(introduce)(x)) == map(backward(leftUnit)(forward(leftUnit)(x)))`.
 */
export type Monoidal<Cat, T1, I1, T2, I2, F> =
    & GenericSemiGroupal<Cat, T1, T2, F>
    & Unital<Cat, I1, I2, F>
    & {
        readonly tensor1: Tensor<Cat, T1, I1>;
        readonly tensor2: Tensor<Cat, T2, I2>;
    };
