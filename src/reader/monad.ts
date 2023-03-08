import type { Get1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export interface MonadReader<R, M> extends Monad<M> {
    readonly ask: () => Get1<M, R>;
    readonly local: (modifier: (record: R) => R) => <A>(m: Get1<M, A>) => Get1<M, A>;
}

export const reader =
    <R, M>(mr: MonadReader<R, M>) =>
    <A>(selector: (record: R) => A): Get1<M, A> =>
        mr.map(selector)(mr.ask());
