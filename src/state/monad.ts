import type { GetHktA1, HktKeyA1 } from "hkt";

import type { Monad1 } from "type-class/monad";

export interface MonadState<S, M extends HktKeyA1> extends Monad1<M> {
    state: <A>(modifier: (state: S) => [A, S]) => GetHktA1<M, A>;
}

export const get = <S, M extends HktKeyA1>(s: MonadState<S, M>): GetHktA1<M, S> =>
    s.state((state) => [state, state]);
export const set =
    <S, M extends HktKeyA1>(s: MonadState<S, M>) =>
    (state: S): GetHktA1<M, []> =>
        s.state(() => [[], state]);

export const modify =
    <S, M extends HktKeyA1>(s: MonadState<S, M>) =>
    (modifier: (state: S) => S): GetHktA1<M, []> =>
        s.state((state) => [[], modifier(state)]);
export const gets =
    <S, M extends HktKeyA1>(s: MonadState<S, M>) =>
    <A>(f: (state: S) => A): GetHktA1<M, A> =>
        s.map(f)(get(s));
