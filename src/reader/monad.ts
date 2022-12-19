import type { GetHktA1 } from "../hkt.js";
import type { Monad1 } from "../type-class/monad.js";

export interface MonadReader<R, M> extends Monad1<M> {
    ask: () => GetHktA1<M, R>;
    local: (modifier: (record: R) => R) => <A>(m: GetHktA1<M, A>) => GetHktA1<M, A>;
}

export const reader =
    <R, M>(mr: MonadReader<R, M>) =>
    <A>(selector: (record: R) => A): GetHktA1<M, A> =>
        mr.map(selector)(mr.ask());
