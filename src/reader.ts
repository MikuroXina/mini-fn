/**
 * This package provides methods for a computation which allows reading external records.
 *
 * A {@link Reader.Reader | `Reader<R, A>`} object represents a computation, reading `R` and returning `A`:
 *
 * ```ts
 * type Reader<R, A> = (record: R) => A;
 * // Note that the actual code is defined as a special case of `ReaderT`.
 * ```
 *
 * And you can work with it by the following methods:
 *
 * - {@link Reader.withReader | `withReader`} - Constructs a new {@link Reader.Reader | `Reader`}  from your computation.
 * - {@link Reader.ask | `ask`} - Makes a pure computation reading the record.
 * - {@link Reader.compose | `compose`} - Composes two {@link Reader.Reader | `Reader`}s.
 * - {@link Reader.local | `local`} - Localizes record to be read.
 * - {@link Reader.run | `run`} - Runs a computation with specified records.
 * - {@link Reader.weaken | `weaken`} - Makes the record type weaker for application.
 * - Monad operations:
 *   - {@link Reader.pure | `pure`} - Wraps a value into a {@link Reader.Reader | `Reader`}.
 *   - {@link Reader.map | `map`} - Transforms the resulting value of {@link Reader.Reader | `Reader`}.
 *   - {@link Reader.apply | `apply`} - Applies a {@link Reader.Reader | `Reader`} which results a function into another one.
 *   - {@link Reader.flatMap | `flatMap`} - Applies a function which returns {@link Reader.Reader | `Reader`} for the resulting value of {@link Reader.Reader | `Reader`}.
 *
 * Moreover a {@link Reader.ReaderT | `ReaderT<R, M, A>`} monad transformer is the generalized version of {@link Reader.Reader | `Reader<R, A>`}. It accepts not `A`, but object on monad `M`.
 *
 * @packageDocumentation
 * @module
 */

// @ts-expect-error
// biome-ignore lint/correctness/noUnusedImports: for test
import * as Cat from "./cat.js";
import type { Apply2Only, Apply3Only, Get1, Hkt2, Hkt3 } from "./hkt.js";
import { type IdentityHkt, monad as identityMonad } from "./identity.js";
// @ts-expect-error
// biome-ignore lint/correctness/noUnusedImports: for test
import * as Option from "./option.js";
import type { Tuple } from "./tuple.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Functor } from "./type-class/functor.js";
import { liftM, type Monad } from "./type-class/monad.js";
import type { Profunctor } from "./type-class/profunctor.js";

/**
 * The reader monad transformer which expresses the environment for asking a record `R` and returning the computation `A` in `M`.
 */
export type ReaderT<R, M, A> = (record: R) => Get1<M, A>;

/**
 * Transforms the computation of `ReaderT` by `fn`.
 *
 * @param fn - The transformer from computation `A` in `M`.
 * @param r - The source environment.
 * @returns The transformed environment.
 */
export const mapReaderT =
    <M, N, A, B>(fn: (ma: Get1<M, A>) => Get1<N, B>) =>
    <R>(r: ReaderT<R, M, A>): ReaderT<R, N, B> =>
    (record: R) =>
        fn(r(record));
/**
 * Maps the record of environment by `mapper`. Note that the mapping is a contravariant.
 *
 * @param mapper - The transformer from new record to old record.
 * @param r - The source environment.
 * @returns The mapped environment.
 */
export const withReaderT =
    <R1, R2>(mapper: (record: R1) => R2) =>
    <M, A>(r: ReaderT<R2, M, A>): ReaderT<R1, M, A> =>
    (record: R1) =>
        r(mapper(record));

/**
 * The reader monad which expresses the environment for asking a record `R` and returning the computation `A`.
 */
export type Reader<R, A> = ReaderT<R, IdentityHkt, A>;

/**
 * Runs the environment with `R`.
 *
 * @param r - The reader environment.
 * @param rec - The record needed to run.
 * @returns The result of run.
 */
export const run =
    <R, A>(r: Reader<R, A>) =>
    (rec: R): A =>
        r(rec);

/**
 * Fetches the record of the environment with monad `S`.
 */
export const askM = <R, S>(m: Monad<S>): Get1<S, Reader<R, R>> =>
    m.pure((x) => x);
/**
 * Fetches the record of the environment.
 *
 * @returns The fetching computation.
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * interface User {
 *     name: string;
 * }
 * const message = (): Reader<User, string> =>
 *     Cat.cat(ask<User>()).feed(map(({ name }) => `Hello, ${name}!`)).value;
 * const box = (): Reader<User, string> =>
 *     Cat.cat(message()).feed(
 *         map((mes) => `<div class="message-box">${mes}</div>`),
 *     ).value;
 *
 * expect(
 *     run(box())({ name: "John" }),
 * ).toStrictEqual(
 *     '<div class="message-box">Hello, John!</div>',
 * );
 * expect(
 *     run(box())({ name: "Alice" }),
 * ).toStrictEqual(
 *     '<div class="message-box">Hello, Alice!</div>',
 * );
 * ```
 */
export const ask = <R>(): Reader<R, R> => askM<R, IdentityHkt>(identityMonad);

/**
 * Executes the computation in an environment modified by `f`.
 *
 * @param f - The function to modify the record of environment.
 * @param ma - The computation to run in the modified environment.
 * @returns The modified environment
 *
 * # Examples
 *
 * @example
 * ```ts @import.meta.vitest
 * interface User {
 *     name: string;
 *     id: string;
 *     score: number;
 * }
 * interface Bulk {
 *     users: readonly User[];
 * }
 * const extractFromBulk = (id: string) =>
 *     local((bulk: Bulk): Option<User> => {
 *         const found = bulk.users.find((elem) => elem.id === id);
 *         if (!found) {
 *             return Option.none();
 *         }
 *         return Option.some(found);
 *     });
 * const scoreReport = (id: string): Reader<Bulk, string> =>
 *     Cat.cat(ask<Option.Option<User>>())
 *         .feed(
 *             map(
 *                 Option.mapOr("user not found")(({ name, score }) =>
 *                     `${name}'s score is ${score}!`
 *                 ),
 *             ),
 *         )
 *         .feed(extractFromBulk(id)).value;
 *
 * const bulk: Bulk = {
 *     users: [
 *         {
 *             name: "John",
 *             id: "1321",
 *             score: 12130,
 *         },
 *         { name: "Alice", id: "4209", score: 320123 },
 *     ],
 * };
 * expect(run(scoreReport("1321"))(bulk)).toStrictEqual("John's score is 12130!");
 * expect(run(scoreReport("4209"))(bulk)).toStrictEqual("Alice's score is 320123!");
 * ```
 */
export const local =
    <T, U>(f: (t: T) => U) =>
    <A>(ma: Reader<U, A>): Reader<T, A> =>
    (t) =>
        ma(f(t));

/**
 * Makes two readers into a reader with tuple of computations.
 *
 * @param a - The left-side reader.
 * @param b - The right-side reader.
 * @returns The reader of tuple.
 */
export const product =
    <R, A>(a: Reader<R, A>) =>
    <B>(b: Reader<R, B>): Reader<R, Tuple<A, B>> =>
    (r: R) => [a(r), b(r)];

/**
 * Constructs a new reader from the computation `reader`.
 *
 * @param reader - The computation to be contained.
 * @returns The new reader.
 */
export const withReader = <R, A>(reader: (a: R) => A): Reader<R, A> => reader;

/**
 * Maps the function `f` onto `Reader<R, _>`.
 *
 * @param f - The mapper of computation.
 * @returns The mapped function.
 */
export const map =
    <T, U>(f: (t: T) => U) =>
    <R>(r: Reader<R, T>): Reader<R, U> =>
    (req) =>
        f(r(req));
/**
 * Applies the reader `r` to the reader `s` with composing the record type. The weaker variant of `apply`.
 *
 * @param r - The reader with record `R` and computation about the function `(a: A) => B`.
 * @param s - The reader with record `S` and computation about `A`.
 * @returns The applied reader with composed record type `R & S`.
 */
export const applyWeak =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    <S>(s: Reader<S, A>): Reader<R & S, B> =>
    (rs) =>
        r(rs)(s(rs));
/**
 * Applies the reader `r` to the reader `s`.
 *
 * @param r - The reader with computation about the function `(a: A) => B`.
 * @param s - The reader with computation about `A`.
 * @returns The applied reader.
 */
export const apply =
    <A, B, R>(r: Reader<R, (a: A) => B>) =>
    (s: Reader<R, A>): Reader<R, B> =>
        applyWeak(r)(s);
/**
 * Creates a new reader environment from the value `a`.
 *
 * @param a - The value to be contained.
 * @returns The new reader.
 */
export const pure =
    <R, A>(a: A): Reader<R, A> =>
    () =>
        a;
/**
 * Maps and flattens the computation `A` into `Reader<R & S, B>` by `f`. The weaker variant of `flatMap`.
 *
 * @param f - The process returns `Reader`.
 * @param r - The reader to compose.
 * @returns The mapped reader.
 */
export const flatMapWeak =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    <S>(r: Reader<S, A>): Reader<R & S, B> =>
    (req) =>
        f(r(req))(req);
/**
 * Maps and flattens the computation `A` into `Reader<R, B>` by `f`.
 *
 * @param f - The process returns `Reader`.
 * @param r - The reader to compose.
 * @returns The mapped reader.
 */
export const flatMap =
    <A, B, R>(f: (a: A) => Reader<R, B>) =>
    (r: Reader<R, A>): Reader<R, B> =>
        flatMapWeak(f)(r);
/**
 * Flattens the nested `Reader`. The weaker variant of `flatten`.
 *
 * @param r - The nested `reader`, but each one has different record type.
 * @returns The flattened reader.
 */
export const flattenWeak =
    <A, R, S>(r: Reader<S, Reader<R, A>>): Reader<R & S, A> =>
    (rs: R & S) =>
        r(rs)(rs);
/**
 * Flattens the nested `Reader`.
 *
 * @param r - The nested `reader`.
 * @returns The flattened reader.
 */
export const flatten = <R, A>(r: Reader<R, Reader<R, A>>): Reader<R, A> =>
    flattenWeak(r);

/**
 * Makes the reader more weaker type. It is useful to compose `Reader` to another one having different record type.
 *
 * @param r - The source reader.
 * @returns The weaker reader.
 */
export const weaken =
    <S>() =>
    <R, A>(r: Reader<R, A>): Reader<R & S, A> =>
        r;

/**
 * Concatenates two readers sequentially.
 *
 * @param r - The first reader to process.
 * @param s - The second reader to process.
 * @returns The concatenated reader.
 */
export const compose =
    <T, U>(r: Reader<T, U>) =>
    <V>(s: Reader<U, V>): Reader<T, V> =>
    (t) =>
        s(r(t));
/**
 * Maps over both arguments of the reader.
 *
 * @param f - The function maps the record type.
 * @param g - The function maps the computation type.
 * @param r - The reader to be mapped.
 * @returns The mapped reader.
 */
export const diMap =
    <A, B>(f: (a: A) => B) =>
    <C, D>(g: (t: C) => D) =>
    (r: Reader<B, C>): Reader<A, D> =>
    (t) =>
        g(r(f(t)));

export const mapT =
    <M>(monad: Monad<M>) =>
    <T, U>(fn: (t: T) => U): (<R>(t: ReaderT<R, M, T>) => ReaderT<R, M, U>) =>
        mapReaderT(liftM(monad)(fn));

export const pureT =
    <M>(monad: Monad<M>) =>
    <R, T>(t: T): ReaderT<R, M, T> =>
    () =>
        monad.pure(t);

export const applyT =
    <M>(monad: Monad<M>) =>
    <R, T, U>(fn: ReaderT<R, M, (t: T) => U>) =>
    (t: ReaderT<R, M, T>): ReaderT<R, M, U> =>
    (record) =>
        monad.apply(fn(record))(t(record));

export const flatMapT =
    <M>(monad: Monad<M>) =>
    <R, T, U>(fn: (t: T) => ReaderT<R, M, U>) =>
    (t: ReaderT<R, M, T>): ReaderT<R, M, U> =>
    (record) =>
        monad.flatMap((t: T) => fn(t)(record))(t(record));

export interface ReaderTHkt extends Hkt3 {
    readonly type: ReaderT<this["arg3"], this["arg2"], this["arg1"]>;
}
export interface ReaderHkt extends Hkt2 {
    readonly type: Reader<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Reader<R, _>`.
 */
export const functor = <R>(): Functor<Apply2Only<ReaderHkt, R>> => ({ map });
/**
 * The instance of `Applicative` for `Reader<R, _>`.
 */
export const applicative = <R>(): Applicative<Apply2Only<ReaderHkt, R>> => ({
    map,
    apply,
    pure,
});
/**
 * The instance of `Monad` for `Reader<R, _>`.
 */
export const monad = <R>(): Monad<Apply2Only<ReaderHkt, R>> => ({
    pure,
    map,
    flatMap,
    apply,
});
/**
 * The instance of `Profunctor` for `Reader`.
 */
export const profunctor: Profunctor<ReaderHkt> = { diMap };

/**
 * The instance of `Functor` for `ReaderT<R, M, _>`.
 */
export const functorT = <R, M>(
    monad: Monad<M>,
): Functor<Apply3Only<ReaderTHkt, R> & Apply2Only<ReaderTHkt, M>> => ({
    map: mapT(monad),
});
/**
 * The instance of `Applicative` for `ReaderT<R, M, _>`.
 */
export const applicativeT = <R, M>(
    monad: Monad<M>,
): Applicative<Apply3Only<ReaderTHkt, R> & Apply2Only<ReaderTHkt, M>> => ({
    map: mapT(monad),
    apply: applyT(monad),
    pure: pureT(monad),
});
/**
 * The instance of `Monad` for `ReaderT<R, M, _>`.
 */
export const monadT = <R, M>(
    monad: Monad<M>,
): Monad<Apply3Only<ReaderTHkt, R> & Apply2Only<ReaderTHkt, M>> => ({
    pure: pureT(monad),
    map: mapT(monad),
    flatMap: flatMapT(monad),
    apply: applyT(monad),
});
