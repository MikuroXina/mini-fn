import type { Get2 } from "../hkt.ts";

/**
 * A 2-arity kind which can compose two relationships. There is no required laws.
 */
export type SemiGroupoid<S> = {
    /**
     * Composes two relationships into a new one.
     *
     * @param funcA - A relationship from `B` to `C`.
     * @param funcB - A relationship from `A` to `B`.
     * @returns The new relation ship from `A` to `C`.
     */
    readonly compose: <B, C>(
        funcA: Get2<S, B, C>,
    ) => <A>(funcB: Get2<S, A, B>) => Get2<S, A, C>;
};
