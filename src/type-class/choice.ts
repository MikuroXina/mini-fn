import type { Get2, Hkt2 } from "../hkt.js";

import type { Profunctor } from "./profunctor.js";
import type { Result } from "../result.js";

export interface Choice<P extends Hkt2> extends Profunctor<P> {
    readonly left: <A, B, C>(curr: Get2<P, A, B>) => Get2<P, Result<A, C>, Result<B, C>>;
    readonly right: <A, B, C>(curr: Get2<P, A, B>) => Get2<P, Result<C, A>, Result<C, B>>;
}
