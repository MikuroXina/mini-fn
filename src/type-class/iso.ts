import type { Get2 } from "../hkt.ts";

/**
 * All instance of `Iso` must satisfy:
 *
 * - For all `x` of `A`; `backward(forward(x)) == x`,
 * - For all `x` of `B`; `forward(backward(x)) == x`.
 */
export interface Iso<Cat, A, B> {
    readonly forward: Get2<Cat, A, B>;
    readonly backward: Get2<Cat, B, A>;
}
