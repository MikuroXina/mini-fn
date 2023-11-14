import type { Apply2Only, Get1, Hkt2, Hkt3 } from "./hkt.ts";
import type { IdentityHkt } from "./identity.ts";
import type { Tuple } from "./tuple.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";

/**
 * The state monad transformer, the computation allows you to carry and modify the state `S` of it and returns the result `A` on `M`.
 */
export interface StateT<S, M, A> {
    (state: S): Get1<M, [A, S]>;
}

/**
 * Runs the computation `s` with the initial state. It is equivalent to the identity function.
 *
 * @param s - The computation to run.
 * @param state - The initial state.
 * @returns The result of run.
 */
export const runStateT = <S, M, A>(
    s: StateT<S, M, A>,
): (state: S) => Get1<M, [A, S]> => s;
/**
 * Evaluates the state computation and returns the final result.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param s - The computation to evaluate.
 * @param state - The initial state.
 * @returns The evaluation of the computation.
 */
export const evaluateStateT =
    <M>(monad: Monad<M>) =>
    <S, A>(s: StateT<S, M, A>) =>
    (state: S): Get1<M, A> => monad.map(([nextA]: [A, S]) => nextA)(s(state));
/**
 * Executes the state computation and returns the final state.
 *
 * @param monad - The instance of `Monad` for `M`.
 * @param s - The computation to evaluate.
 * @param state - The initial state.
 * @returns The execution of the computation.
 */
export const executeStateT =
    <M>(monad: Monad<M>) =>
    <S, A>(s: StateT<S, M, A>) =>
    (state: S): Get1<M, S> => monad.map(([, nextS]: [A, S]) => nextS)(s(state));
/**
 * Maps both the return value and final state of the computation by `fn`.
 *
 * @param fn - The mapper of computation from `A` to `B` on `M` with state `S`.
 * @param s - The computation to be mapped.
 * @returns The mapped computation.
 */
export const mapStateT =
    <M, N, S, A, B>(fn: (m: Get1<M, [A, S]>) => Get1<N, [B, S]>) =>
    (s: StateT<S, M, A>): StateT<S, N, B> =>
    (state: S) => fn(s(state));
/**
 * Modifies the state of the computation `s` with `fn`.
 *
 * @param fn - The state modifier.
 * @param s - The computation to be modified.
 * @returns The modified computation.
 */
export const withStateT =
    <S, M, A>(fn: (state: S) => S) =>
    (s: StateT<S, M, A>): StateT<S, M, A> =>
    (state: S) => s(fn(state));

/**
 * The state monad, the computation allows you to carry and modify the state `S` of it and returns the result `A`.
 */
export type State<S, A> = StateT<S, IdentityHkt, A>;

/**
 * Runs the computation `s` with the initial state. It is equivalent to the identity function.
 *
 * @param s - The computation to run.
 * @param state - The initial state.
 * @returns The result of run.
 */
export const runState = <S, A>(s: State<S, A>): (state: S) => [A, S] => s;
/**
 * Evaluates the state computation and returns the final result.
 *
 * @param s - The computation to evaluate.
 * @param state - The initial state.
 * @returns The evaluation of the computation.
 */
export const evaluateState = <S, A>(s: State<S, A>) => (state: S): A =>
    s(state)[0];
/**
 * Executes the state computation and returns the final state.
 *
 * @param s - The computation to evaluate.
 * @param state - The initial state.
 * @returns The execution of the computation.
 */
export const executeState = <S, A>(s: State<S, A>) => (state: S): S =>
    s(state)[1];
/**
 * Maps both the return value and final state of the computation by `fn`.
 *
 * @param fn - The mapper between the result of computation.
 * @param s - The computation to be mapped.
 * @returns The mapped computation.
 */
export const mapState =
    <S, A, B>(fn: (a: [A, S]) => [B, S]) =>
    (s: State<S, A>): State<S, B> =>
    (state) => fn(s(state));
/**
 * Modifies the state of the computation `s` with `fn`.
 *
 * @param fn - The state modifier.
 * @param s - The computation to be modified.
 * @returns The modified computation.
 */
export const withState =
    <S, A>(fn: (state: S) => S) =>
    (s: State<S, A>): State<S, A> =>
    (state: S) => s(fn(state));

/**
 * Creates a computation that fetches the current state in the monad. You need to dive in the monad to use the value.
 *
 * @returns The computation which fetches the current state.
 */
export const get = <S>(): State<S, S> => (state: S) => [state, state];
/**
 * Creates a computation that sets the new state in the monad.
 *
 * @param state - The new state value.
 * @returns The computation which sets the new state.
 */
export const put = <S>(state: S): State<S, void> => () => [undefined, state];

/**
 * Makes two computations into a product about the result type.
 *
 * @param a - The left-side computation.
 * @param b - The right-side computation.
 * @returns The computation which the result type is a product of them.
 */
export const product =
    <S, A>(a: State<S, A>) =>
    <B>(b: State<S, B>): State<S, Tuple<A, B>> =>
    (state) => {
        const [aRes, nextState] = a(state);
        const [bRes, lastState] = b(nextState);
        return [[aRes, bRes], lastState];
    };
/**
 * Maps the computation by `fn` over `State<S, _>`.
 *
 * @param fn - The function to be applied.
 * @param s - The computation to be mapped.
 * @returns The mapped computation.
 */
export const map =
    <S, A, B>(fn: (a: A) => B) => (s: State<S, A>): State<S, B> => (state) => {
        const [answer, nextState] = s(state);
        return [fn(answer), nextState];
    };
/**
 * Applies the function returned by the computation `sMap`.
 *
 * @param sMap - The computation returns the function to map.
 * @param s - The computation to be mapped.
 * @returns The applied computation.
 */
export const apply =
    <S, A, B>(sMap: State<S, (a: A) => B>) =>
    (s: State<S, A>): State<S, B> =>
    (state: S) => {
        const [ans1, state1] = sMap(state);
        const [ans2, state2] = s(state1);
        return [ans1(ans2), state2];
    };
/**
 * Wraps the value as a computation which does nothing.
 *
 * @param a - The value to be contained.
 * @returns The computation that does nothing.
 */
export const pure = <S, A>(a: A): State<S, A> => (s: S) => [a, s];
/**
 * Maps and flattens the computation by `fn` over `State<S, _>`.
 *
 * @param fn - The function to map.
 * @param s - The computation to be mapped.
 * @returns The mapped and flattened computation.
 */
export const flatMap =
    <S, A, B>(fn: (a: A) => State<S, B>) =>
    (s: State<S, A>): State<S, B> =>
    (state) => {
        const [ans, nextState] = s(state);
        return fn(ans)(nextState);
    };
/**
 * Flattens the nested computation. It is equivalent to `flatMap((s) => s)(ss)`.
 *
 * @param ss - The nested computation.
 * @returns The flattened computation.
 */
export const flatten = <S, A>(ss: State<S, State<S, A>>): State<S, A> =>
    flatMap((s: State<S, A>) => s)(ss);

export interface StateTHkt extends Hkt3 {
    readonly type: StateT<this["arg3"], this["arg2"], this["arg1"]>;
}

export interface StateHkt extends Hkt2 {
    readonly type: State<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `State<S, _>`.
 */
export const functor = <S>(): Functor<Apply2Only<StateHkt, S>> => ({ map });
/**
 * The instance of `Monad` for `State<S, _>`.
 */
export const monad = <S>(): Monad<Apply2Only<StateHkt, S>> => ({
    map,
    apply,
    pure,
    flatMap,
});
