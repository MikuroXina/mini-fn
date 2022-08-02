import type { Applicative2 } from "./type-class/applicative";
import type { Functor2 } from "./type-class/functor";
import type { Monad2 } from "./type-class/monad";

declare const stateNominal: unique symbol;
export type StateHktKey = typeof stateNominal;

export interface State<out A, in out S> {
    (state: S): readonly [A, S];
}

export const run =
    <A, S>(s: State<A, S>) =>
    (state: S) =>
        s(state);
export const evaluate =
    <A, S>(s: State<A, S>) =>
    (state: S): S =>
        s(state)[1];
export const execute =
    <A, S>(s: State<A, S>) =>
    (state: S): A =>
        s(state)[0];
export const withState =
    <A, S>(s: State<A, S>) =>
    (fn: (state: S) => S): State<A, S> =>
    (state) =>
        s(fn(state));
export const get =
    <S>(): State<S, S> =>
    (state: S) =>
        [state, state];
export const put =
    <S>(state: S): State<[], S> =>
    () =>
        [[], state];

export const map =
    <A, B, S>(fn: (a: A) => B) =>
    (s: State<A, S>): State<B, S> =>
    (state) => {
        const [answer, nextState] = s(state);
        return [fn(answer), nextState];
    };
export const apply =
    <A, B, S>(sMap: State<(a: A) => B, S>) =>
    (s: State<A, S>): State<B, S> =>
    (state: S) => {
        const [ans1, state1] = sMap(state);
        const [ans2, state2] = s(state1);
        return [ans1(ans2), state2];
    };
export const pure =
    <A, S>(a: A): State<A, S> =>
    (s: S) =>
        [a, s];
export const flatMap =
    <A, B, S>(fn: (a: A) => State<B, S>) =>
    (s: State<A, S>): State<B, S> =>
    (state) => {
        const [ans, nextState] = s(state);
        return fn(ans)(nextState);
    };
export const flatten = <A, S>(ss: State<State<A, S>, S>): State<A, S> =>
    flatMap((s: State<A, S>) => s)(ss);

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [stateNominal]: State<A1, A2>;
    }
}

export const functor: Functor2<StateHktKey> = { map };
export const applicative: Applicative2<StateHktKey> = { map, apply, pure };
export const monad: Monad2<StateHktKey> = { map, apply, pure, flatMap };
