import type { Apply2Only, Get1, Hkt1, Hkt2, Hkt3 } from "./hkt.js";
import type { IdentityHkt } from "./identity.js";
import type { Tuple } from "./tuple.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";

export interface StateT<S, M, A> {
    (state: S): Get1<M, [A, S]>;
}

export const runStateT =
    <S, M, A>(s: StateT<S, M, A>) =>
    (state: S): Get1<M, [A, S]> =>
        s(state);
export const evaluateStateT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <S, A>(s: StateT<S, M, A>) =>
    (state: S): Get1<M, S> =>
        monad.map(([, nextS]: [A, S]) => nextS)(s(state));
export const executeStateT =
    <M extends Hkt1>(monad: Monad<M>) =>
    <S, A>(s: StateT<S, M, A>) =>
    (state: S): Get1<M, A> =>
        monad.map(([nextA]: [A, S]) => nextA)(s(state));
export const mapStateT =
    <M, N, S, A, B>(fn: (m: Get1<M, [A, S]>) => Get1<N, [B, S]>) =>
    (s: StateT<S, M, A>): StateT<S, N, B> =>
    (state: S) =>
        fn(s(state));
export const withStateT =
    <S, M, A>(fn: (state: S) => S) =>
    (s: StateT<S, M, A>): StateT<S, M, A> =>
    (state: S) =>
        s(fn(state));

export type State<S, A> = StateT<S, IdentityHkt, A>;

export const runState =
    <S, A>(s: State<S, A>) =>
    (state: S): [A, S] =>
        s(state);
export const evaluateState =
    <S, A>(s: State<S, A>) =>
    (state: S): A =>
        s(state)[0];
export const executeState =
    <S, A>(s: State<S, A>) =>
    (state: S): S =>
        s(state)[1];
export const mapState =
    <S, A, B>(fn: (a: [A, S]) => [B, S]) =>
    (s: State<S, A>): State<S, B> =>
    (state) =>
        fn(s(state));
export const withState =
    <S, A>(fn: (state: S) => S) =>
    (s: State<S, A>): State<S, A> =>
    (state: S) =>
        s(fn(state));
export const get =
    <S>(): State<S, S> =>
    (state: S) =>
        [state, state];
export const put =
    <S>(state: S): State<S, []> =>
    () =>
        [[], state];

export const product =
    <S, A>(a: State<S, A>) =>
    <B>(b: State<S, B>): State<S, Tuple<A, B>> =>
    (state) => {
        const [aRes, nextState] = a(state);
        const [bRes, lastState] = b(nextState);
        return [[aRes, bRes], lastState];
    };
export const map =
    <S, A, B>(fn: (a: A) => B) =>
    (s: State<S, A>): State<S, B> =>
    (state) => {
        const [answer, nextState] = s(state);
        return [fn(answer), nextState];
    };
export const apply =
    <S, A, B>(sMap: State<S, (a: A) => B>) =>
    (s: State<S, A>): State<S, B> =>
    (state: S) => {
        const [ans1, state1] = sMap(state);
        const [ans2, state2] = s(state1);
        return [ans1(ans2), state2];
    };
export const pure =
    <S, A>(a: A): State<S, A> =>
    (s: S) =>
        [a, s];
export const flatMap =
    <S, A, B>(fn: (a: A) => State<S, B>) =>
    (s: State<S, A>): State<S, B> =>
    (state) => {
        const [ans, nextState] = s(state);
        return fn(ans)(nextState);
    };
export const flatten = <S, A>(ss: State<S, State<S, A>>): State<S, A> =>
    flatMap((s: State<S, A>) => s)(ss);

export interface StateTHkt extends Hkt3 {
    readonly type: StateT<this["arg3"], this["arg2"], this["arg1"]>;
}

export interface StateHkt extends Hkt2 {
    readonly type: State<this["arg2"], this["arg1"]>;
}

export const functor = <S>(): Functor<Apply2Only<StateHkt, S>> => ({ map });
export const monad = <S>(): Monad<Apply2Only<StateHkt, S>> => ({
    map,
    apply,
    pure,
    flatMap,
});
