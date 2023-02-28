import type { Get2 } from "../hkt.js";

export interface SemiGroupoid<S> {
    readonly compose: <B, C>(funcA: Get2<S, B, C>) => <A>(funcB: Get2<S, A, B>) => Get2<S, A, C>;
}
