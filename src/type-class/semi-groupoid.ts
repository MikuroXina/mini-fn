import type { Get2, Hkt2 } from "../hkt.js";

export interface SemiGroupoid<S extends Hkt2> {
    readonly compose: <A, B, C>(funcA: Get2<S, A, B>) => (funcB: Get2<S, B, C>) => Get2<S, A, C>;
}
