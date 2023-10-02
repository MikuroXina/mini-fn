/**
 * @packageDocumentation
 * Transformation terminal for a Functor.
 * ```text
 * S --|     never
 *  [ map ]
 * T <-|     never
 * ```
 */

import { doT } from "../cat.js";
import type { Get1, Get2 } from "../hkt.js";
import { type Option, some } from "../option.js";
import * as MonadReader from "../reader/monad.js";
import * as MonadState from "../state/monad.js";
import type { Tuple } from "../tuple.js";
import { Category } from "../type-class.js";
import { type Arrow, fanOut } from "../type-class/arrow.js";
import type { Functor } from "../type-class/functor.js";
import type { Monad } from "../type-class/monad.js";
import type { Monoid } from "../type-class/monoid.js";
import { leftMap, type Profunctor } from "../type-class/profunctor.js";
import type { SemiGroup } from "../type-class/semi-group.js";
import type { Contravariant } from "../type-class/variance.js";
import * as MonadWriter from "../writer/monad.js";

/**
 * `Setter` is a `Optic` which transform `S` into `T` with function `A` to `B`.
 *
 * All instance `s` for `Setter` must satisfy these conditions:
 *
 * - Identity: if `s` is a `Setter<S, S, A, A>`, then `s(id) == id`.
 * - Holding composition: `compose(s(f))(s(g)) == s(compose(f)(g))` for all `f` and `g`.
 */
export interface Setter<S, T, A, B> {
    (over: (a: A) => B): (s: S) => T;
}
export type SetterSimple<S, A> = Setter<S, S, A, A>;

/**
 * Modifies going data as a terminal.
 *
 * @param mapper - The function to map the data going.
 * @returns The mapping optic like `over`.
 */
export const set =
    <S, T>(mapper: (s: S) => T): Setter<S, T, never, never> =>
    () =>
        mapper;

/**
 * Creates a new `Setter` from function. It is equivalent to an identity function.
 */
export const sets = <S, T, A, B>(f: (over: (a: A) => B) => (s: S) => T): Setter<S, T, A, B> => f;

/**
 * Extracts a converting function from `Setter`. It is equivalent to an identity function.
 */
export const over = <S, T, A, B>(l: Setter<S, T, A, B>): ((over: (a: A) => B) => (s: S) => T) => l;

/**
 * Replaces the value at entry with the value.
 *
 * @param lens - The lens focused to.
 * @param newValue - The value will be inserted.
 * @returns The transformation computation.
 */
export const replace =
    <S, T, A, B>(lens: Setter<S, T, A, B>) =>
    (newValue: B): ((s: S) => T) =>
        lens(() => newValue);

/**
 * Replaces the optional value at entry with the some value.
 *
 * @param lens - The lens focused to.
 * @param newValue - The value will be inserted.
 * @returns The transformation computation.
 */
export const replaceSome =
    <S, T, A, B>(lens: Setter<S, T, A, Option<B>>) =>
    (newValue: B): ((s: S) => T) =>
        lens(() => some(newValue));

/**
 * Replaces the value at entry with the value, and keeps the inserted item.
 *
 * @param lens - The lens focused to.
 * @param newValue - The value will be inserted.
 * @returns The transformation computation.
 */
export const replaceThrough =
    <S, T, A, B>(lens: Setter<S, T, A, B>) =>
    (newValue: B) =>
    (s: S): [B, T] => [newValue, replace(lens)(newValue)(s)];

/**
 * Replaces the optional value at entry with the some value, and keeps the inserted item.
 *
 * @param lens - The lens focused to.
 * @param newValue - The value will be inserted.
 * @returns The transformation computation.
 */
export const replaceSomeThrough =
    <S, T, A, B>(lens: Setter<S, T, A, Option<B>>) =>
    (newValue: B) =>
    (s: S): [B, T] => [newValue, replaceSome(lens)(newValue)(s)];

/**
 * Modifies data contained by `Functor`.
 */
export const setF = <F, S, T>(f: Functor<F>): Setter<Get1<F, S>, Get1<F, T>, S, T> => f.map;

/**
 * Modifies data contained by `Monad`.
 */
export const setM = <M, S, T>(m: Monad<M>): Setter<Get1<M, S>, Get1<M, T>, S, T> => m.map;

/**
 * Modifies data contained by `Contravariant`.
 */
export const setC = <F, S, T>(c: Contravariant<F>): Setter<Get1<F, S>, Get1<F, T>, T, S> =>
    c.contraMap;

/**
 * Modifies data contained by `Profunctor`.
 */
export const setP: <P, S, T, R>(p: Profunctor<P>) => Setter<Get2<P, S, R>, Get2<P, T, R>, T, S> =
    leftMap;

/**
 * Replaces the focused state with the new value.
 *
 * @param m - The instance of `MonadState`.
 * @param lens - The lens to focus.
 * @param newValue - The value to insert.
 * @returns The replacing computation.
 */
export const assign =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, B>) =>
    (newValue: B): Get1<M, void> =>
        MonadState.modify(m)(lens(() => newValue));

/**
 * Applies the function to the focused state.
 *
 * @param m - The instance of `MonadState`
 * @param lens - The lens to focus.
 * @param mapper - The function to apply.
 * @returns The applying computation.
 */
export const modifying =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, B>) =>
    (mapper: (a: A) => B): Get1<M, void> =>
        MonadState.modify(m)(lens(mapper));

/**
 * Replaces the focused state with the new some value.
 *
 * @param m - The instance of `MonadState`.
 * @param lens - The lens to focus.
 * @param newValue - The value to insert.
 * @returns The replacing computation.
 */
export const assignSome =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, Option<B>>) =>
    (newValue: B): Get1<M, void> =>
        MonadState.modify(m)(lens(() => some(newValue)));

/**
 * Replaces the focused state with result of the computation.
 *
 * @param m - The instance of `MonadState`.
 * @param lens - The lens to focus.
 * @param computation - The computation.
 * @returns The replacing computation.
 */
export const binding =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, B>) =>
    (computation: Get1<M, B>): Get1<M, void> =>
        m.flatMap(assign(m)(lens))(computation);

/**
 * Replaces the focused state with the new value, and keeps its context as the new value.
 *
 * @param m - The instance of `MonadState`.
 * @param lens - The lens to focus.
 * @param newValue - The value to insert.
 * @returns The replacing computation.
 */
export const assignThrough =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, B>) =>
    (newValue: B): Get1<M, B> =>
        doT(m)
            .then(assign(m)(lens)(newValue))
            .finish(() => newValue);

/**
 * Replaces the focused optional state with the new some value, and keeps its context as the new value.
 *
 * @param m - The instance of `MonadState`.
 * @param lens - The lens to focus.
 * @param newValue - The value to insert.
 * @returns The replacing computation.
 */
export const assignSomeThrough =
    <S, M>(m: MonadState.MonadState<S, M>) =>
    <A, B>(lens: Setter<S, S, A, Option<B>>) =>
    (newValue: B): Get1<M, B> =>
        doT(m)
            .then(assignSome(m)(lens)(newValue))
            .finish(() => newValue);

/**
 * Combines the semi-group value to the right.
 *
 * @param semi - The instance of `SemiGroup`.
 * @param lens - The lens to focus.
 * @param right - The value applied to the right.
 * @returns The composing computation.
 */
export const composing =
    <A>(semi: SemiGroup<A>) =>
    <S, T>(lens: Setter<S, T, A, A>) =>
    (right: A): ((s: S) => T) =>
        lens((left) => semi.combine(left, right));

/**
 * Replaces the focused semi-group state with combining the value to the right.
 *
 * @param m - The instance of `MonadState`.
 * @param semi - The instance of `SemiGroup`.
 * @param lens - The lens to focus.
 * @param right - The value applied to the right.
 * @returns The composing computation.
 */
export const assignComposing =
    <S, M, A>(m: MonadState.MonadState<S, M>, semi: SemiGroup<A>) =>
    (lens: SetterSimple<S, A>) =>
    (right: A): Get1<M, void> =>
        MonadState.modify(m)(composing(semi)(lens)(right));

// write operations:

/**
 * Expands writing format for to write the focused fragment.
 *
 * @param m - The instance of `MonadState`.
 * @param mon - The instance of `Monoid`.
 * @param lens - The lens to focus.
 * @param newValue - The fragment to write.
 * @returns The expanded writing operation.
 */
export const scribe =
    <T, M, S>(m: MonadWriter.MonadWriter<T, M>, mon: Monoid<S>) =>
    <A, B>(lens: Setter<S, T, A, B>) =>
    (newValue: B): Get1<M, void> =>
        m.tell(lens(() => newValue)(mon.identity));

/**
 * Runs the computation and writes to its context.
 *
 * @param m - The instance of `MonadWriter`.
 * @param lens - The lens to focus.
 * @param mod - The computation to be evaluated.
 * @returns The evaluation computation.
 */
export const passing =
    <W, M>(m: MonadWriter.MonadWriter<W, M>) =>
    <U, V>(lens: Setter<W, W, U, V>) =>
    <A>(mod: Get1<M, readonly [A, (u: U) => V]>): Get1<M, A> =>
        m.pass(
            doT(m)
                .let("auv", mod)
                .finish(({ auv: [a, uv] }) => [a, lens(uv)]),
        );

/**
 * Maps over the focused value on `MonadWriter`.
 *
 * @param m - The instance of `MonadWriter`.
 * @param lens - The lens to focus.
 * @param mapper - The function which maps from `U` to `V`.
 * @returns The mapping operation.
 */
export const censoring =
    <W, M>(m: MonadWriter.MonadWriter<W, M>) =>
    <U, V>(lens: Setter<W, W, U, V>) =>
    (mapper: (u: U) => V): (<A>(ma: Get1<M, A>) => Get1<M, A>) =>
        MonadWriter.censor(m)(lens(mapper));

// reader operations:

export const locally =
    <S, M>(m: MonadReader.MonadReader<S, M>) =>
    <A, B>(lens: Setter<S, S, A, B>) =>
    (mapper: (a: A) => B): (<R>(mr: Get1<M, R>) => Get1<M, R>) =>
        m.local(lens(mapper));

// arrows:

/**
 * Runs the arrow command `psb` and replaces the result over the focus.
 *
 * @param a - The instance of `Arrow`.
 * @param lens - The lens to focus.
 * @param psb - The arrow command.
 * @returns The expanded arrow command.
 */
export const assignA =
    <P>(a: Arrow<P>) =>
    <S, T, A, B>(lens: Setter<S, T, A, B>) =>
    (psb: Get2<P, S, B>): Get2<P, S, T> => {
        const fromSToBt = a.arr((s: S) => (b: B) => lens(() => b)(s));
        const fromSToBBt = fanOut(a)(psb)(fromSToBt);
        const fromBBtToT = a.arr(([b, bt]: Tuple<B, (b: B) => T>) => bt(b));
        return Category.compose(a)(fromBBtToT)(fromSToBBt);
    };
