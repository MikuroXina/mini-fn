import type { GetHktA1, HktKeyA1 } from "hkt";

import type { Monad1 } from "type-class/monad";

export interface MonadReader<R, M extends HktKeyA1> extends Monad1<M> {
    ask: () => GetHktA1<M, R>;
    local: (modifier: (record: R) => R) => <A>(m: GetHktA1<M, A>) => GetHktA1<M, A>;
}

export const reader =
    <R, M extends HktKeyA1>(mr: MonadReader<R, M>) =>
    <A>(selector: (record: R) => A): GetHktA1<M, A> =>
        mr.map(selector)(mr.ask());
