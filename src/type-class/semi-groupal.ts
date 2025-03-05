import type { Get1, Get2 } from "../hkt.ts";
import type { Tuple } from "../tuple.ts";
import type { Associative } from "./associative.ts";

export type SemiGroupal<F> = {
    readonly product: <A, B>(
        fa: Get1<F, A>,
    ) => (fb: Get1<F, B>) => Get1<F, Tuple<A, B>>;
};

/**
 * All instance of `GenericSemiGroupal` must satisfy:
 *
 * - For all `x`; `combine(genericRightMap(combine)(backward(assoc)(x))) == map(backward(assoc))(combine(genericLeftMap(combine)(x)))`.
 */
export type GenericSemiGroupal<Cat, T1, T2, F> = {
    readonly assoc1: Associative<Cat, T1>;
    readonly assoc2: Associative<Cat, T2>;
    readonly combine: <X, Y>() => Get2<
        Cat,
        Get2<T2, Get1<F, X>, Get1<F, Y>>,
        Get1<F, Get2<T1, X, Y>>
    >;
};
