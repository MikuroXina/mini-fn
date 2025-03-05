import type { Get2 } from "../hkt.ts";
import type { Result } from "../result.ts";
import type { Profunctor } from "./profunctor.ts";

export type Choice<P> = Profunctor<P> & {
    readonly left: <A, B, C>(
        curr: Get2<P, A, B>,
    ) => Get2<P, Result<A, C>, Result<B, C>>;
    readonly right: <A, B, C>(
        curr: Get2<P, A, B>,
    ) => Get2<P, Result<C, A>, Result<C, B>>;
};
