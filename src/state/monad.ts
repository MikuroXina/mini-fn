import type { Get1 } from "../hkt.js";
import type { Monad } from "../type-class/monad.js";

export type MonadState<S, M> = Monad<M> & {
    readonly state: <A>(modifier: (state: S) => [A, S]) => Get1<M, A>;
};

export const get = <S, M>(s: MonadState<S, M>): Get1<M, S> =>
    s.state((state) => [state, state]);
export const set =
    <S, M>(s: MonadState<S, M>) =>
    (state: S): Get1<M, never[]> =>
        s.state(() => [[], state]);

export const modify =
    <S, M>(s: MonadState<S, M>) =>
    (modifier: (state: S) => S): Get1<M, never[]> =>
        s.state((state) => [[], modifier(state)]);
export const gets =
    <S, M>(s: MonadState<S, M>) =>
    <A>(f: (state: S) => A): Get1<M, A> =>
        s.map(f)(get(s));
