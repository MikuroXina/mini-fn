/**
 * This module provides the mutable reference in the state transformer monad. It allows you to program destructive operations safely.
 *
 * @packageDocumentation
 * @module
 */

import type { Applicative } from "./type-class/applicative.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Apply2Only, Hkt2 } from "./hkt.ts";
import type { Monad } from "./type-class/monad.ts";
import { type CatT, doT } from "./cat.ts";

declare const threadNominal: unique symbol;
/**
 * A thread scope `S` that controls variables in computations on `Mut<S, _>`.
 */
export type Thread<S> = { [threadNominal]: S };

const wrapThread = <S, A>(dict: Map<MutRef<S, A>, MutVar<A>>): Thread<S> =>
    dict as unknown as Thread<S>;

const newThreadVar = <A>(value: A): <S>(thread: Thread<S>) => MutRef<S, A> => {
    const newRefSym = Symbol();
    return <S>(thread: Thread<S>): MutRef<S, A> => {
        const newRef = newRefSym as unknown as MutRef<S, A>;
        const internal = thread as unknown as Map<MutRef<S, A>, MutVar<A>>;
        internal.set(newRef, wrapVar(value));
        return newRef;
    };
};

const readThreadVar =
    <S, A>(ref: MutRef<S, A>) => (thread: Thread<S>): MutVar<A> => {
        const internal = thread as unknown as Map<MutRef<S, A>, MutVar<A>>;
        if (!internal.has(ref)) {
            throw new Error("uninitialized variable used");
        }
        const got = internal.get(ref)!;
        return got;
    };

const writeThreadVar =
    <S, A>(ref: MutRef<S, A>) => (newValue: A) => (thread: Thread<S>): void => {
        const internal = thread as unknown as Map<MutRef<S, A>, MutVar<A>>;
        internal.set(ref, wrapVar(newValue));
    };

const dropThreadVar =
    <S, A>(ref: MutRef<S, A>) => (thread: Thread<S>): void => {
        const internal = thread as unknown as Map<MutRef<S, A>, MutVar<A>>;
        internal.delete(ref);
    };

declare const retNominal: unique symbol;
/**
 * A foreign value of type `A` as a computation result of `Mut`.
 */
export type MutVar<A> = { [retNominal]: A };
const wrapVar = <A>(value: A): MutVar<A> => value as unknown as MutVar<A>;
const unwrapVar = <A>(ret: MutVar<A>): A => ret as unknown as A;

/**
 * A state transformer monad, which allows for destructive updates. A computation of type `Mut<S, A>` denotes that returns a value of type `A` in *thread* `S`, which is a free type variable.
 */
export type Mut<S, A> = (
    thread: Thread<S>,
) => MutVar<A>;

export interface MutHkt extends Hkt2 {
    readonly type: Mut<this["arg2"], this["arg1"]>;
}

/**
 * Executes a `Mut` by a state *thread*.
 *
 * To hide the internal state, the type parameter `S` is universal quantified.
 *
 * @param mut - To be executed.
 * @returns The result of computation.
 */
export const runMut = <A>(mut: <S>() => Mut<S, A>): A =>
    unwrapVar(mut()(wrapThread(new Map())));

/**
 * Executes a `Mut` with `CatT` of `Mut<S, _>>` by a state *thread*.
 *
 * To hide the internal state, the type parameter `S` is universal quantified.
 *
 * @param mut - To be executed.
 * @returns The result of computation.
 */
export const doMut = <A>(
    mut: <S>(
        cat: CatT<Apply2Only<MutHkt, S>, Record<string, never>>,
    ) => Mut<S, A>,
): A => unwrapVar(mut(doT(monad()))(wrapThread(new Map())));

/**
 * Wraps the value of type `A` into `Mut<_, A>`.
 *
 * @param value - To be wrapped.
 * @returns The new `Mut`.
 */
export const pureMut = <S, A>(value: A): Mut<S, A> => () => wrapVar(value);

/**
 * Maps a value over `Mut<S, _>` by `fn`.
 *
 * @param fn - A function to map the value.
 * @param mut - A `Mut` to be mapped.
 * @returns The mapped new `Mut`.
 */
export const mapMut =
    <A, B>(fn: (a: A) => B) => <S>(mut: Mut<S, A>): Mut<S, B> => (thread) => {
        const a = mut(thread);
        return wrapVar(fn(unwrapVar(a)));
    };

/**
 * Applies a `Mut` of function to a `Mut` of value.
 *
 * @param fn - A function over `Mut` to map.
 * @param mut - A `Mut` to be mapped.
 * @returns The applied new `Mut`.
 */
export const applyMut =
    <S, A, B>(fn: Mut<S, (a: A) => B>) => (mut: Mut<S, A>): Mut<S, B> =>
        flatMapMut((f: (a: A) => B) => mapMut(f)(mut))(fn);

/**
 * Maps and flattens a `Mut` by `fn`.
 *
 * @param fn - A function that returns a `Mut`.
 * @param mut - A `Mut` to be mapped.
 * @returns The mapped new `Mut`.
 */
export const flatMapMut =
    <S, A, B>(fn: (a: A) => Mut<S, B>) =>
    (mut: Mut<S, A>): Mut<S, B> =>
    (thread) => {
        const a = mut(thread);
        return fn(unwrapVar(a))(thread);
    };

/**
 * @returns The `Functor` instance for `Mut<S, _>`.
 */
export const functor = <S>(): Functor<Apply2Only<MutHkt, S>> => ({
    map: mapMut,
});

/**
 * @returns The `Applicative` instance for `Mut<S, _>`.
 */
export const applicative = <S>(): Applicative<Apply2Only<MutHkt, S>> => ({
    map: mapMut,
    pure: pureMut,
    apply: applyMut,
});

/**
 * @returns The `Monad` instance for `Mut<S, _>`.
 */
export const monad = <S>(): Monad<Apply2Only<MutHkt, S>> => ({
    ...applicative(),
    flatMap: flatMapMut,
});

declare const mutRefNominal: unique symbol;
/**
 * A mutable variable in state thread `S`, containing a value of type `A`.
 */
export type MutRef<S, A> = { [mutRefNominal]: [S, A] };

export interface MutRefHkt extends Hkt2 {
    readonly type: MutRef<this["arg2"], this["arg1"]>;
}

/**
 * Creates a new mutable reference for the value in a scope of `Mut` environment.
 *
 * @param value - The initial value.
 * @returns The new mutable reference for `value` on `Mut`.
 */
export const newMutRef = <S, A>(value: A): Mut<S, MutRef<S, A>> => (thread) =>
    wrapVar(newThreadVar(value)(thread));

/**
 * Reads a value from the reference in a scope of `Mut` environment. It throws on the referent value was not initialized or dropped.
 *
 * @param ref - A target to read.
 * @returns The reading operation which results the read value.
 */
export const readMutRef = <S, A>(ref: MutRef<S, A>): Mut<S, A> =>
    readThreadVar(ref);

/**
 * Writes a value into the reference in a scope of `Mut` environment.
 *
 * @param ref - A target to write.
 * @param newValue - To be written.
 * @returns The writing operation.
 */
export const writeMutRef =
    <S, A>(ref: MutRef<S, A>) => (newValue: A): Mut<S, never[]> => (thread) => {
        writeThreadVar(ref)(newValue)(thread);
        return wrapVar([]);
    };

/**
 * Modifies a value of the reference in a scope of `Mut` environment.
 *
 * @param ref - A target to modify.
 * @param modifier - A function to transform the value.
 * @returns The modifying operation.
 */
export const modifyMutRef =
    <S, A>(ref: MutRef<S, A>) =>
    (modifier: (oldValue: A) => A): Mut<S, never[]> =>
        doT(monad<S>())
            .addM("value", readMutRef(ref))
            .addWith("modified", ({ value }) => modifier(value))
            .finishM(({ modified }) => writeMutRef(ref)(modified));

/**
 * Invalidates a reference to ensure that the reference is marked as invalid.
 *
 * @param ref - A target to invalidate.
 * @returns The dropping operation.
 */
export const dropMutRef =
    <S, A>(ref: MutRef<S, A>): Mut<S, never[]> => (thread) => {
        dropThreadVar(ref)(thread);
        return wrapVar([]);
    };
