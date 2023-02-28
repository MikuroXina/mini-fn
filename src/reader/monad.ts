import type { Get1, Hkt1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export interface MonadReader<R, M extends Hkt1> extends Monad<M> {
    readonly ask: () => Get1<M, R>;
    readonly local: (modifier: (record: R) => R) => <A>(m: Get1<M, A>) => Get1<M, A>;
}

export const reader =
    <R, M extends Hkt1>(mr: MonadReader<R, M>) =>
    <A>(selector: (record: R) => A): Get1<M, A> =>
        mr.map(selector)(mr.ask());
