import type { Get2 } from "../hkt.js";

/**
 * All instance of `Iso` must satisfy:
 *
 * - For all `x` of `A`; `backward(forward(x)) == x`,
 * - For all `x` of `B`; `forward(backward(x)) == x`.
 */
export type Iso<Cat, A, B> = {
    readonly forward: Get2<Cat, A, B>;
    readonly backward: Get2<Cat, B, A>;
};
