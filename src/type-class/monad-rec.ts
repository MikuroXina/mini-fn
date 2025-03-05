import {
    type ControlFlow,
    isContinue,
    newBreak,
    newContinue,
} from "../control-flow.ts";
import type { Get1 } from "../hkt.ts";
import { mapOrElse, type Option } from "../option.ts";
import { replace } from "./functor.ts";
import type { Monad } from "./monad.ts";
import type { Monoid } from "./monoid.ts";

/**
 * An extended `Monad` also supports the `tailRecM` operation.
 */
export type MonadRec<M> = Monad<M> & {
    /**
     * Executes a `stepper` while it returns a `Continue<A>`. This exits only if `stepper` returned a `Break<A>` and forwards it.
     *
     * Almost all of the `MonadRec` instances are implemented with a simple `while` loop because JavaScript runtime rarely optimizes a tail call.
     *
     * @param stepper - A function to run with its control flow.
     * @returns The execution result.
     */
    readonly tailRecM: <X, A>(
        stepper: (state: A) => Get1<M, ControlFlow<X, A>>,
    ) => (state: A) => Get1<M, X>;
};

export const tailRecM2 = <M>(m: MonadRec<M>) =>
<A, B, X>(
    stepper: (a: A) => (b: B) => Get1<M, ControlFlow<X, readonly [A, B]>>,
) =>
(a: A) =>
(b: B): Get1<M, X> =>
    m.tailRecM(([a, b]: readonly [A, B]) => stepper(a)(b))([a, b]);

export const tailRecM3 = <M>(m: MonadRec<M>) =>
<A, B, C, X>(
    stepper: (
        a: A,
    ) => (b: B) => (c: C) => Get1<M, ControlFlow<X, readonly [A, B, C]>>,
) =>
(a: A) =>
(b: B) =>
(c: C): Get1<M, X> =>
    m.tailRecM(([a, b, c]: readonly [A, B, C]) => stepper(a)(b)(c))([
        a,
        b,
        c,
    ]);

/**
 * A `MonadRec` instance for `Identity`.
 */
export const tailRec = <X, A>(stepper: (a: A) => ControlFlow<X, A>) =>
(
    initialA: A,
): X => {
    let flow = stepper(initialA);
    while (isContinue(flow)) {
        flow = stepper(flow[1]);
    }
    return flow[1];
};

export const tailRec2 = <X, A, B>(
    stepper: (a: A) => (b: B) => ControlFlow<X, readonly [A, B]>,
) =>
(initialA: A) =>
(initialB: B): X =>
    tailRec(([a, b]: readonly [A, B]) => stepper(a)(b))([
        initialA,
        initialB,
    ]);

export const tailRec3 = <X, A, B, C>(
    stepper: (a: A) => (b: B) => (c: C) => ControlFlow<X, readonly [A, B, C]>,
) =>
(initialA: A) =>
(initialB: B) =>
(initialC: C): X =>
    tailRec(([a, b, c]: readonly [A, B, C]) => stepper(a)(b)(c))([
        initialA,
        initialB,
        initialC,
    ]);

/**
 * Starts an infinite loop of the operation `op`.
 *
 * @param m - A `MonadRec` instance for `M`.
 * @returns The infinite loop operation.
 */
export const forever =
    <M>(m: MonadRec<M>) => <A, B>(op: Get1<M, A>): Get1<M, B> =>
        m.tailRecM((state: never[]): Get1<M, ControlFlow<B, never[]>> =>
            replace(m)(newContinue(state))(op)
        )([]);

/**
 * Executes an optional operation `optionOp` while it returns a `Some` value. The accumulated result of it will be returned.
 *
 * @param mon - A `Monoid` instance for `T`.
 * @param m - A `MonadRec` instance for `M`.
 * @param optionOp - An optional operation.
 * @returns The looping and accumulating operation.
 */
export const whileSome =
    <T>(mon: Monoid<T>) =>
    <M>(m: MonadRec<M>) =>
    (optionOp: Get1<M, Option<T>>): Get1<M, T> =>
        m.tailRecM((state: T): Get1<M, ControlFlow<T, T>> =>
            m.map(
                mapOrElse((): ControlFlow<T, T> => newBreak(state))(
                    (item: T) => newContinue(mon.combine(state, item)),
                ),
            )(optionOp)
        )(mon.identity);

/**
 * Executes an optional operation `optionOp` until it returns a `Some` value.
 *
 * @param m - A `MonadRec` instance for `M`.
 * @param optionOp - An optional operation.
 * @returns The retrying operation.
 */
export const untilSome =
    <M>(m: MonadRec<M>) => <T>(optionOp: Get1<M, Option<T>>): Get1<M, T> =>
        m.tailRecM((_: never[]): Get1<M, ControlFlow<T, never[]>> =>
            m.map(
                mapOrElse((): ControlFlow<T, never[]> => newContinue([]))(
                    newBreak<T>,
                ),
            )(optionOp)
        )([]);
