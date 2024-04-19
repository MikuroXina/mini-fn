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

export interface MonadRec<M> extends Monad<M> {
    readonly tailRecM: <X, A>(
        stepper: (state: A) => Get1<M, ControlFlow<X, A>>,
    ) => (state: A) => Get1<M, X>;
}

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

export const forever =
    <M>(m: MonadRec<M>) => <A, B>(op: Get1<M, A>): Get1<M, B> =>
        m.tailRecM((state: []): Get1<M, ControlFlow<B, []>> =>
            replace(m)(newContinue(state))(op)
        )([]);

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

export const untilSome =
    <M>(m: MonadRec<M>) => <T>(optionOp: Get1<M, Option<T>>): Get1<M, T> =>
        m.tailRecM((_: []): Get1<M, ControlFlow<T, []>> =>
            m.map(
                mapOrElse((): ControlFlow<T, []> => newContinue([]))(
                    newBreak<T>,
                ),
            )(optionOp)
        )([]);
