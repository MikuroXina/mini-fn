import type { Functor2 } from "./type-class/functor";
import type { Monad2 } from "./type-class/monad";

declare const stateNominal: unique symbol;
export type StateHktKey = typeof stateNominal;

export interface State<in out S, out A> {
    (state: S): readonly [A, S];
}

export const run =
    <S, A>(state: S) =>
    (s: State<S, A>) =>
        s(state);
export const evaluate =
    <S, A>(state: S) =>
    (s: State<S, A>): S =>
        s(state)[1];
export const execute =
    <S, A>(state: S) =>
    (s: State<S, A>): A =>
        s(state)[0];
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
    <B>(b: State<S, B>): State<S, [A, B]> =>
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

declare module "./hkt" {
    interface HktDictA2<A1, A2> {
        [stateNominal]: State<A1, A2>;
    }
}

export const functor: Functor2<StateHktKey> = { map };
export const monad: Monad2<StateHktKey> = {
    product,
    map,
    apply,
    pure,
    flatMap,
};
