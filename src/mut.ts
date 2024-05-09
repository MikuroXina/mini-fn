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
import { doT } from "./cat.ts";

declare const threadNominal: unique symbol;
export type Thread<S> = { [threadNominal]: S };

const wrapThread = <S, A>(dict: Map<MutRef<S, A>, MutVar<A>>): Thread<S> =>
    dict as unknown as Thread<S>;

const newThreadVar = <A>(value: A) => <S>(thread: Thread<S>): MutRef<S, A> => {
    const internal = thread as unknown as Map<MutRef<S, A>, MutVar<A>>;
    const newRef = Symbol() as unknown as MutRef<S, A>;
    internal.set(newRef, wrapVar(value));
    return newRef;
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
export type MutVar<A> = { [retNominal]: A };
const wrapVar = <A>(value: A): MutVar<A> => value as unknown as MutVar<A>;
const unwrapVar = <A>(ret: MutVar<A>): A => ret as unknown as A;

/**
 * A state transformer monad, which allows for destructive updates. A computation of type `Mut<S, A>` denotes that returns a value of type `A` in *thread* `S`, which is a free type variable.
 */
export type Mut<S, A> = (
    thread: Thread<S>,
) => [thread: Thread<S>, ret: MutVar<A>];

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
    unwrapVar(mut()(wrapThread(new Map()))[1]);

export const pureMut =
    <S, A>(value: A): Mut<S, A> => (thread) => [thread, wrapVar(value)];

export const mapMut =
    <A, B>(fn: (a: A) => B) => <S>(mut: Mut<S, A>): Mut<S, B> => (thread) => {
        const [newThread, a] = mut(thread);
        return [newThread, wrapVar(fn(unwrapVar(a)))];
    };

export const applyMut =
    <S, A, B>(fn: Mut<S, (a: A) => B>) => (mut: Mut<S, A>): Mut<S, B> =>
        flatMapMut((f: (a: A) => B) => mapMut(f)(mut))(fn);

export const flatMapMut =
    <S, A, B>(fn: (a: A) => Mut<S, B>) =>
    (mut: Mut<S, A>): Mut<S, B> =>
    (thread) => {
        const [newThread, a] = mut(thread);
        return fn(unwrapVar(a))(newThread);
    };

export const functor = <S>(): Functor<Apply2Only<MutHkt, S>> => ({
    map: mapMut,
});

export const applicative = <S>(): Applicative<Apply2Only<MutHkt, S>> => ({
    map: mapMut,
    pure: pureMut,
    apply: applyMut,
});

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
export const newMutRef = <S, A>(value: A): Mut<S, MutRef<S, A>> => (thread) => [
    thread,
    wrapVar(newThreadVar(value)(thread)),
];

/**
 * Reads a value from the reference in a scope of `Mut` environment. It throws on the referent value was not initialized or dropped.
 *
 * @param ref - A target to read.
 * @returns The reading operation which results the read value.
 */
export const readMutRef = <S, A>(ref: MutRef<S, A>): Mut<S, A> => (thread) => [
    thread,
    readThreadVar(ref)(thread),
];

/**
 * Writes a value into the reference in a scope of `Mut` environment.
 *
 * @param ref - A target to write.
 * @param newValue - To be written.
 * @returns The writing operation.
 */
export const writeMutRef =
    <S, A>(ref: MutRef<S, A>) => (newValue: A): Mut<S, []> => (thread) => {
        writeThreadVar(ref)(newValue)(thread);
        return [
            thread,
            wrapVar([]),
        ];
    };

/**
 * Modifies a value of the reference in a scope of `Mut` environment.
 *
 * @param ref - A target to modify.
 * @param modifier - A function to transform the value.
 * @returns The modifying operation.
 */
export const modifyMutRef =
    <S, A>(ref: MutRef<S, A>) => (modifier: (oldValue: A) => A): Mut<S, []> =>
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
export const dropMutRef = <S, A>(ref: MutRef<S, A>): Mut<S, []> => (thread) => {
    dropThreadVar(ref)(thread);
    return [
        thread,
        wrapVar([]),
    ];
};
