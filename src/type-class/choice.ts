import type { Get2 } from "../hkt.js";
import type { Result } from "../result.js";
import type { Profunctor } from "./profunctor.js";

export interface Choice<P> extends Profunctor<P> {
    readonly left: <A, B, C>(curr: Get2<P, A, B>) => Get2<P, Result<A, C>, Result<B, C>>;
    readonly right: <A, B, C>(curr: Get2<P, A, B>) => Get2<P, Result<C, A>, Result<C, B>>;
}
