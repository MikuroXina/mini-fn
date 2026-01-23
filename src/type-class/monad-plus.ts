import { doT } from "../cat.js";
import type { Get1 } from "../hkt.js";
import { mapOrElse, type Option } from "../option.js";
import type { Alternative } from "./alternative.js";
import type { Monad } from "./monad.js";

/**
 * A monad with monoid-ish combine operation.
 */
export interface MonadPlus<M> extends Monad<M>, Alternative<M> {}

/**
 * Executes the action `body` repeatedly while the condition `pred` returns `true`.
 */
export const whileM =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    (pred: Get1<M, boolean>) =>
    <A>(body: Get1<M, A>): Get1<M, Get1<F, A>> => {
        const go = (): Get1<M, Get1<F, A>> =>
            doT(monad)
                .addM("cond", pred)
                .finishM(({ cond }) =>
                    cond
                        ? doT(monad)
                              .addM("a", body)
                              .addM("fa", go())
                              .finish(({ a, fa }) => plus.alt(plus.pure(a))(fa))
                        : monad.pure(plus.empty<A>()),
                );
        return go();
    };

/**
 * Executes the action `body` repeatedly until the condition `pred` returns `true`.
 */
export const untilM =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    (pred: Get1<M, boolean>) =>
    <A>(body: Get1<M, A>): Get1<M, Get1<F, A>> =>
        doT(monad)
            .addM("a", body)
            .addM(
                "fa",
                whileM(monad, plus)(monad.map((cond: boolean) => !cond)(pred))(
                    body,
                ),
            )
            .finish(({ a, fa }) => plus.alt(plus.pure(a))(fa));

/**
 * Executes the action `body` repeatedly while the condition `pred` returns `Some` value. `body` will be called with the value contained in the `Some`.
 */
export const whileSome =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    <A>(pred: Get1<M, Option<A>>) =>
    <B>(body: (a: A) => Get1<M, B>): Get1<M, Get1<F, B>> => {
        const go = (): Get1<M, Get1<F, B>> =>
            doT(monad)
                .addM("cond", pred)
                .finishM(({ cond }) =>
                    mapOrElse(() => monad.pure(plus.empty<B>()))((a: A) =>
                        doT(monad)
                            .addM("b", body(a))
                            .addM("bs", go())
                            .finish(({ b, bs }) => plus.alt(plus.pure(b))(bs)),
                    )(cond),
                );
        return go();
    };

/**
 * Executes the action `body` repeatedly while the condition `pred` returns `Some` value. `body` will be called with the value contained in the `Some` but the result will be discarded .
 */
export const whileSomeVoid =
    <M>(monad: Monad<M>) =>
    <A>(pred: Get1<M, Option<A>>) =>
    <B>(body: (a: A) => Get1<M, B>): Get1<M, never[]> => {
        const go = (): Get1<M, never[]> =>
            doT(monad)
                .addM("cond", pred)
                .finishM(({ cond }) =>
                    mapOrElse(() => monad.pure([]))((a: A) =>
                        doT(monad).addM("_", body(a)).finishM(go),
                    )(cond),
                );
        return go();
    };

/**
 * Unfolds into a data structure of `F` from the result of `builder` until it returns a `None`.
 */
export const unfoldM =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    <A>(builder: Get1<M, Option<A>>): Get1<M, Get1<F, A>> =>
        whileSome(monad, plus)(builder)(monad.pure);

/**
 * Executes the `builder` repeatedly until it returns a `None`.
 */
export const unfoldMVoid =
    <M>(monad: Monad<M>) =>
    <A>(builder: Get1<M, Option<A>>): Get1<M, never[]> =>
        whileSomeVoid(monad)(builder)(monad.pure);

/**
 * Executes the `body` repeatedly until the condition `pred` satisfies. Results of `body` will be collected as a data structure `F` (except the final failed one).
 */
export const unfoldWhileM =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    <A>(pred: (a: A) => boolean) =>
    (body: Get1<M, A>): Get1<M, Get1<F, A>> => {
        const go = (fa: Get1<F, A>): Get1<M, Get1<F, A>> =>
            doT(monad)
                .addM("a", body)
                .finishM(({ a }) =>
                    pred(a) ? go(plus.alt(fa)(plus.pure(a))) : monad.pure(fa),
                );
        return go(plus.empty());
    };

/**
 * Unfolds the result of `builder` into a data structure `F` from the right side.
 */
export const unfoldRM =
    <M, F>(monad: Monad<M>, plus: MonadPlus<F>) =>
    <A, B>(
        builder: (state: A) => Get1<M, Option<[B, A]>>,
    ): ((initialState: A) => Get1<M, Get1<F, B>>) => {
        const go = (state: A): Get1<M, Get1<F, B>> =>
            doT(monad)
                .addM("res", builder(state))
                .finishM(({ res }) =>
                    mapOrElse(() => monad.pure(plus.empty<B>()))(
                        ([ret, state]: [B, A]) =>
                            doT(monad)
                                .addM("fb", go(state))
                                .finish(({ fb }) =>
                                    plus.alt(plus.pure(ret))(fb),
                                ),
                    )(res),
                );
        return go;
    };

/**
 * Executes the stateful `builder` repeatedly until it returns a `None`.
 */
export const unfoldRMVoid =
    <M>(monad: Monad<M>) =>
    <A>(
        builder: (state: A) => Get1<M, Option<A>>,
    ): ((initialState: A) => Get1<M, never[]>) => {
        const go = (state: A): Get1<M, never[]> =>
            doT(monad)
                .addM("res", builder(state))
                .finishM(({ res }) => mapOrElse(() => monad.pure([]))(go)(res));
        return go;
    };
