import type { Get2 } from "../hkt.js";

export interface Bifunctor<P> {
    readonly biMap: <A, B>(
        first: (a: A) => B,
    ) => <C, D>(second: (c: C) => D) => (curr: Get2<P, A, C>) => Get2<P, B, D>;
}
