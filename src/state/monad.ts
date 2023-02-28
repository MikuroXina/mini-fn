import type { Get1, Hkt1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export interface MonadState<S, M extends Hkt1> extends Monad<M> {
    readonly state: <A>(modifier: (state: S) => [A, S]) => Get1<M, A>;
}

export const get = <S, M extends Hkt1>(s: MonadState<S, M>): Get1<M, S> =>
    s.state((state) => [state, state]);
export const set =
    <S, M extends Hkt1>(s: MonadState<S, M>) =>
    (state: S): Get1<M, []> =>
        s.state(() => [[], state]);

export const modify =
    <S, M extends Hkt1>(s: MonadState<S, M>) =>
    (modifier: (state: S) => S): Get1<M, []> =>
        s.state((state) => [[], modifier(state)]);
export const gets =
    <S, M extends Hkt1>(s: MonadState<S, M>) =>
    <A>(f: (state: S) => A): Get1<M, A> =>
        s.map(f)(get(s));
