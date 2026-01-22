import type { MonadCont } from "./cont/monad.js";
import { type ControlFlow, isContinue, newContinue } from "./control-flow.js";
import { id } from "./func.js";
import type { Apply2Only, Get1, Hkt1, Hkt2 } from "./hkt.js";
import type { MonadPromise } from "./promise/monad.js";
import type { Alternative } from "./type-class/alternative.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Apply } from "./type-class/apply.js";
import { type FlatMap, flatten } from "./type-class/flat-map.js";
import type { Foldable } from "./type-class/foldable.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";
import type { MonadPlus } from "./type-class/monad-plus.js";
import type { MonadRec } from "./type-class/monad-rec.js";
import type { Pure } from "./type-class/pure.js";
import type { SemiGroupal } from "./type-class/semi-groupal.js";
import type { Traversable } from "./type-class/traversable.js";
import type { TraversableMonad } from "./type-class/traversable-monad.js";

/**
 * Monad transformer `PromiseT`, a generic form of `Promise`.
 */
export type PromiseT<M, A> = Promise<Get1<M, A>>;

/**
 * Makes a new `Promise` that always fails over.
 */
export const failT = <M, A>(): PromiseT<M, A> =>
    Promise.reject(new Error("fail over"));

/**
 * Wraps the value of monad into a `Promise`. This is an alias of `Promise.resolve`.
 */
export const pureT =
    <M>(f: Pure<M>) =>
    <A>(a: A): PromiseT<M, A> =>
        Promise.resolve(f.pure(a));

/**
 * Makes two `PromiseT`s into a `PromiseT` of tuple.
 *
 * @param semi - The instance for `SemiGroupal` of `M`.
 * @param a - The left-side promise.
 * @param b - The right-side promise.
 * @returns The promise of product.
 */
export const productT =
    <M>(semi: SemiGroupal<M>) =>
    <A>(a: PromiseT<M, A>) =>
    <B>(b: PromiseT<M, B>): PromiseT<M, [A, B]> =>
        a.then((ma) => b.then(semi.product(ma)));

/**
 * Maps item in a `PromiseT` by `fn`.
 *
 * @param f - The instance for `Functor` of `M`.
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const mapT =
    <M>(f: Functor<M>) =>
    <T, U>(fn: (t: T) => U) =>
    (t: PromiseT<M, T>): PromiseT<M, U> =>
        t.then(f.map(fn));

/**
 * Maps and flatten an item of `PromiseT` by `fn`.
 *
 * @param m - The instance of `Traversable` and `FlatMap` for `M`.
 * @param fn - A function to transform `T` into `PromiseT<M, U>`.
 * @param t - A promise to be transformed.
 * @returns The transformed promise.
 */
export const flatMapT =
    <M>(m: Traversable<M> & FlatMap<M>) =>
    <T, U>(fn: (t: T) => PromiseT<M, U>) =>
    (t: PromiseT<M, T>): PromiseT<M, U> =>
        t.then(m.traverse(applicative)(fn)).then(flatten(m));

/**
 * Applies the function in a `PromiseT`.
 *
 * @param fn - A `PromiseT` which contains function.
 * @param t - A `PromiseT` to be transformed.
 * @returns The applied `PromiseT`.
 */
export const applyT =
    <M>(m: Apply<M>) =>
    <T, U>(fn: PromiseT<M, (t: T) => U>) =>
    (t: PromiseT<M, T>): PromiseT<M, U> =>
        t.then((mt) => fn.then((mfn) => m.apply(mfn)(mt)));

/**
 * Folds the computation result over `F`.
 *
 * @param f - The `Foldable` instance for `F`.
 * @param folder - The function folding from right.
 * @param init - The initial data of folding.
 * @param data - To be folded.
 * @returns The folded result on `Promise`.
 */
export const foldRT =
    <F>(f: Foldable<F>) =>
    <A, B>(folder: (next: A) => (acc: B) => B) =>
    (init: B) =>
    (data: PromiseT<F, A>): Promise<B> =>
        data.then(f.foldR(folder)(init));

/**
 * Traverses the result of computation `M` over `F`.
 *
 * @param m - The `Traversable` instance for `M`.
 * @param f - The `Applicative` instance for `F`.
 * @param visitor - The mapping function.
 * @param data - To be traversed.
 * @returns The collected result over `F` in computation `M`.
 */
export const traverseT =
    <M, F>(m: Traversable<M>, f: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (data: PromiseT<M, A>): PromiseT<F, Get1<M, B>> =>
        data.then(m.traverse(f)(visitor));

/**
 * Collects the result of computation `M` over `F`.
 *
 * @param m - The `Traversable` instance for `M`.
 * @param f - The `Applicative` instance for `F`.
 * @param data - To be traversed.
 * @returns The collected result over `F` in computation `M`.
 */
export const sequenceT = <M, F>(
    m: Traversable<M>,
    f: Applicative<F>,
): (<A>(data: PromiseT<M, Get1<F, A>>) => PromiseT<F, Get1<M, A>>) =>
    traverseT(m, f)((x) => x);

/**
 * Picks the first successful computation over `M`. It will try `first` at first, but if `first` throws an error, it discards the error and uses `second`.
 *
 * @param first - The first attempt.
 * @param second - The second attempt.
 * @returns The first successful computation over `M`.
 */
export const altT =
    <M, A>(first: PromiseT<M, A>) =>
    (second: PromiseT<M, A>): PromiseT<M, A> =>
        first.catch(() => second);

export interface PromiseTHkt extends Hkt2 {
    readonly type: PromiseT<this["arg2"], this["arg1"]>;
}

/**
 * @param m - The instance of `Functor` for `M`.
 * @returns The instance of `Functor` for `PromiseT<M, _>`.
 */
export const functorT = <M>(
    m: Functor<M>,
): Functor<Apply2Only<PromiseTHkt, M>> => ({
    map: mapT(m),
});

/**
 * @param m - The instance of `Functor`, `Apply` and `Pure` for `M`.
 * @returns The instance of `Applicative` for `PromiseT<M, _>`.
 */
export const applicativeT = <M>(
    m: Functor<M> & Apply<M> & Pure<M>,
): Applicative<Apply2Only<PromiseTHkt, M>> => ({
    pure: pureT(m),
    map: mapT(m),
    apply: applyT(m),
});

/**
 * @param m - The instance of `Traversable`, `Apply` and `FlatMap` for `M`.
 * @returns The instance of `Monad` for `PromiseT<M, _>`.
 */
export const monadT = <M>(
    m: TraversableMonad<M>,
): Monad<Apply2Only<PromiseTHkt, M>> => ({
    pure: pureT(m),
    map: mapT(m),
    apply: applyT(m),
    flatMap: flatMapT(m),
});

/**
 * The `Alternative` instance for `PromiseT<M, _>` for any applicative functor `M`.
 */
export const alternativeT = <M>(
    a: Applicative<M>,
): Alternative<Apply2Only<PromiseTHkt, M>> => ({
    ...applicativeT(a),
    empty: failT,
    alt: altT,
});

/**
 * The `MonadPlus` instance for `PromiseT<M, _>` for any traversable monad `M`.
 */
export const monadPlusT = <M>(
    m: TraversableMonad<M>,
): MonadPlus<Apply2Only<PromiseTHkt, M>> => ({
    ...monadT(m),
    ...alternativeT(m),
});

/**
 * Makes a new `Promise` that always fails over.
 */
export const fail = <A>(): Promise<A> => Promise.reject(new Error("fail over"));

/**
 * Wraps the value into `Promise`. This is the alias of `Promise.resolve`.
 */
export const pure = <A>(value: A): Promise<A> => Promise.resolve(value);

/**
 * Makes two promises into a promise of tuple.
 *
 * @param a - The left-side promise.
 * @param b - The right-side promise.
 * @returns The promise of product.
 */
export const product =
    <A>(a: Promise<A>) =>
    <B>(b: Promise<B>): Promise<[A, B]> =>
        Promise.all([a, b]);

/**
 * Maps an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const map: <T, U>(fn: (t: T) => U) => (t: Promise<T>) => Promise<U> =
    (f) => (t) =>
        t.then(f);

/**
 * Maps and flatten an item in the promise by `fn`.
 *
 * @param fn - The function to transform `T` into `U`.
 * @param t - The promise to be transformed.
 * @returns The transformed promise.
 */
export const flatMap: <T, U>(
    fn: (t: T) => Promise<U>,
) => (t: Promise<T>) => Promise<U> = (f) => (t) => t.then(f);

/**
 * Applies the function in promise.
 *
 * @param fn - The promise of function.
 * @param t - The promise to be transformed.
 * @returns The applied promise.
 */
export const apply: <T, U>(
    fn: Promise<(t: T) => U>,
) => (t: Promise<T>) => Promise<U> = (f) => (t) =>
    t.then((value) => f.then((func) => func(value)));

/**
 * Transform the continuation-passing style into the promise. The parameter for `computation` is `continuation` error handle which aborts the computation.
 *
 * @param computation - The computation about `Promise`.
 * @returns The transformed promise.
 */
export const callCC = async <A, B>(
    computation: (continuation: (a: A) => Promise<B>) => Promise<A>,
): Promise<A> => {
    class ContinuationBail {
        constructor(public readonly value: A) {}
    }
    try {
        return await computation((err) => {
            throw new ContinuationBail(err);
        });
    } catch (err) {
        if (err instanceof ContinuationBail) {
            return err.value;
        }
        throw err;
    }
};

/**
 * Repeats the `stepper` until it returns `Break` over `Promise`.
 *
 * @param stepper - To be repeated with the state. It returns the next state of `Continue` or the return value of `Break`.
 * @param state - The initial state for `stepper`.
 * @returns The computation which results value of `Break`.
 */
export const tailRecM =
    <X, A>(stepper: (state: A) => Promise<ControlFlow<X, A>>) =>
    async (state: A): Promise<X> => {
        let flow: ControlFlow<X, A> = newContinue(state);
        while (isContinue(flow)) {
            flow = await stepper(flow[1]);
        }
        return flow[1];
    };

/**
 * Re-exports `Promise.all` from the standard API.
 */
export const all: <T>(
    iterable: Iterable<T | PromiseLike<T>>,
) => Promise<Awaited<T>[]> = Promise.all.bind(Promise);

/**
 * Re-exports `Promise.allSettled` from the standard API.
 */
export const allSettled: <T extends readonly unknown[] | []>(
    values: T,
) => Promise<{
    -readonly [P in keyof T]: PromiseSettledResult<Awaited<T[P]>>;
}> = Promise.allSettled.bind(Promise);

/**
 * Re-exports `Promise.any` from the standard API.
 */
export const any: <T extends readonly unknown[] | []>(
    values: T,
) => Promise<Awaited<T[number]>> = Promise.any.bind(Promise);

/**
 * Re-exports `Promise.race` from the standard API.
 */
export const race: <T extends readonly unknown[] | []>(
    values: T,
) => Promise<Awaited<T[number]>> = Promise.race.bind(Promise);

/**
 * Re-exports `Promise.reject` from the standard API.
 */
export const reject: <T = never>(reason?: unknown) => Promise<T> =
    Promise.reject.bind(Promise);

/**
 * Re-exports `Promise.resolve` from the standard API.
 */
export const resolve: <T>(value: T | PromiseLike<T>) => Promise<Awaited<T>> =
    Promise.resolve.bind(Promise);

/**
 * Picks the first successful computation. It will try `first` at first, but if `first` throws an error, it discards the error and uses `second`.
 *
 * @param first - The first attempt.
 * @param second - The second attempt.
 * @returns The first successful computation.
 */
export const alt =
    <T>(first: Promise<T>) =>
    (second: Promise<T>): Promise<T> =>
        first.catch(() => second);

export interface PromiseHkt extends Hkt1 {
    readonly type: Promise<this["arg1"]>;
}

/**
 * The instance of `Functor` for `Promise`.
 */
export const functor: Functor<PromiseHkt> = { map };

/**
 * The instance of `Applicative` for `Promise`.
 */
export const applicative: Applicative<PromiseHkt> = {
    pure,
    map,
    apply,
};

/**
 * The instance of `Monad` for `Promise`.
 */
export const monad: Monad<PromiseHkt> = {
    pure,
    map,
    flatMap: flatMap,
    apply,
};

/**
 * The instance of `MonadCont` for `Promise`.
 */
export const monadCont: MonadCont<PromiseHkt> = {
    ...monad,
    callCC: callCC,
};

/**
 * The instance of `MonadPromise` for `Promise`.
 */
export const monadPromise: MonadPromise<PromiseHkt> = {
    ...monad,
    liftPromise: id,
};

/**
 * The instance of `MonadRec` for `Promise`.
 */
export const monadRec: MonadRec<PromiseHkt> = { ...monad, tailRecM };

/**
 * The `Alternative` instance for `Promise`.
 */
export const alternative: Alternative<PromiseHkt> = {
    ...applicative,
    empty: fail,
    alt,
};

/**
 * The `MonadPlus` instance for `Promise`.
 */
export const monadPlus: MonadPlus<PromiseHkt> = {
    ...alternative,
    ...monad,
};
