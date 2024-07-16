import type { Get1, Hkt1 } from "./hkt.ts";
import { type Decoder, type Encoder, mapDecoder } from "./serial.ts";
import type { Applicative } from "./type-class/applicative.ts";
import {
    type Eq,
    fromProjection as eqFromProjection,
} from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import {
    fromProjection as ordFromProjection,
    type Ord,
} from "./type-class/ord.ts";
import {
    fromProjection as partialEqFromProjection,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import {
    fromProjection as partialOrdFromProjection,
    type PartialOrd,
} from "./type-class/partial-ord.ts";
import type { Traversable } from "./type-class/traversable.ts";
import { sequenceA } from "./type-class/traversable.ts";

declare const lazyNominal: unique symbol;
const deferNominal = Symbol("LazyDefer");
const knownNominal = Symbol("LazyKnown");

/**
 * An uninitialized variant of `Lazy<L>`.
 */
export type DeferredLazy<L> = {
    type: typeof deferNominal;
    deferred: () => L;
    [lazyNominal]: never;
};

/**
 * An initialized variant of `Lazy<L>`.
 */
export type KnownLazy<L> = {
    type: typeof knownNominal;
    known: L;
    deferred: () => L;
    [lazyNominal]: never;
};

/**
 * The lazy evaluated value of type `L`. It is useful to improve evaluating the data structure eagerly produces infinite recursion. You can get the actual value by calling `force` function.
 *
 * Once evaluated the deferred function, the known value will be cached. You should not provide a function which has no referential transparency.
 */
export type Lazy<L> = DeferredLazy<L> | KnownLazy<L>;

/**
 * Makes the function into `Lazy` to defer the evaluation.
 *
 * @param deferred - The function to be contained.
 * @returns The new `Lazy`.
 */
export const defer = <L>(deferred: () => L): Lazy<L> =>
    ({
        type: deferNominal,
        deferred,
    }) as Lazy<L>;

/**
 * Converts the calculated value into a `lazy`.
 *
 * @param value - The value already known.
 * @returns The new `Lazy`.
 */
export const known = <L>(value: L): Lazy<L> =>
    ({
        type: knownNominal,
        deferred: () => value,
        known: value,
    }) as Lazy<L>;

/**
 * Force to evaluate the value of `Lazy`, by calling the contained function, or returns the cached value.
 *
 * @param lazy - The instance of `Lazy`.
 * @returns The evaluated value.
 */
export const force = <L>(lazy: Lazy<L>): L => {
    if (lazy.type === knownNominal) {
        return lazy.known;
    }
    const evaluated = lazy.deferred();
    (lazy as unknown as KnownLazy<L>).type = knownNominal;
    (lazy as unknown as KnownLazy<L>).known = evaluated;
    return evaluated;
};

export const partialEq: <T>(equality: PartialEq<T>) => PartialEq<Lazy<T>> =
    partialEqFromProjection<LazyHkt>(force);
export const eq: <T>(equality: Eq<T>) => Eq<Lazy<T>> = eqFromProjection<
    LazyHkt
>(force);
export const partialOrd: <T>(equality: PartialOrd<T>) => PartialOrd<Lazy<T>> =
    partialOrdFromProjection<LazyHkt>(force);
export const ord: <T>(equality: Ord<T>) => Ord<Lazy<T>> = ordFromProjection<
    LazyHkt
>(force);

/**
 * Wraps the evaluated value as a `Lazy`.
 *
 * @param a - The value.
 * @returns The wrapped one.
 */
export const pure = known;
/**
 * Maps the function onto `Lazy`.
 *
 * @param fn - The function to be mapped.
 * @returns The function on `Lazy`.
 */
export const map = <A, B>(fn: (a: A) => B) => (lazy: Lazy<A>): Lazy<B> =>
    defer(() => fn(force(lazy)));
/**
 * Maps and flattens the function onto `Lazy`.
 *
 * @param fn - The function to be mapped and flattened.
 * @returns The function on `Lazy`.
 */
export const flatMap =
    <A, B>(fn: (a: A) => Lazy<B>) => (lazy: Lazy<A>): Lazy<B> =>
        defer(() => force(fn(force(lazy))));
/**
 * Applies the function with `Lazy`.
 *
 * @param fn - The function to be applied.
 * @param t - The value to apply.
 * @returns The applied `Lazy`.
 */
export const apply =
    <T1, U1>(fn: Lazy<(t: T1) => U1>) => (t: Lazy<T1>): Lazy<U1> =>
        defer(() => force(fn)(force(t)));
/**
 * Makes a product of two `Lazy`s.
 *
 * @param fa - The left-side of product.
 * @param fb - The right-side of product.
 * @returns The product of two `Lazy`s.
 */
export const product = <A, B>(fa: Lazy<A>) => (fb: Lazy<B>): Lazy<[A, B]> =>
    defer(() => [force(fa), force(fb)]);

/**
 * Decomposes a lazy product.
 *
 * @param tuple - The lazy evaluated tuple.
 * @returns The tuple of lazy evaluated values.
 */
export const unzip = <A, B>(
    tuple: Lazy<readonly [A, B]>,
): readonly [Lazy<A>, Lazy<B>] => [
    defer(() => force(tuple)[0]),
    defer(() => force(tuple)[1]),
];

/**
 * Decomposes a lazy data which has `Applicative` instance.
 *
 * @param applicative - The `Applicative` instance for `F`.
 * @param data - The lazy data in `F`.
 * @returns The decomposed data of lazy evaluated values.
 */
export const sequence = <F>(
    applicative: Applicative<F>,
): <T>(data: Lazy<Get1<F, T>>) => Get1<F, Lazy<T>> =>
    sequenceA(traversable, applicative);

/**
 * Folds the internal value with `folder`.
 *
 * @param folder - Folds the value with `A` and `B`.
 * @param init - The initial value of folding.
 * @param data - The target to fold.
 * @returns The folded value.
 */
export const foldR =
    <A, B>(folder: (a: A) => (b: B) => B) => (init: B) => (data: Lazy<A>): B =>
        folder(force(data))(init);
/**
 * Traverses `Lazy` as the data structure.
 *
 * @param app - The instance of `Applicative` for `F`.
 * @param visitor - The function makes `A` into `B` in `F`.
 * @param data - The target to traverse.
 * @returns The traversed value.
 */
export const traverse =
    <F>(app: Applicative<F>) =>
    <A, B>(visitor: (a: A) => Get1<F, B>) =>
    (data: Lazy<A>): Get1<F, Lazy<B>> => app.map(pure)(visitor(force(data)));

export interface LazyHkt extends Hkt1 {
    readonly type: Lazy<this["arg1"]>;
}

/**
 * The instance of `Functor` for `Lazy`.
 */
export const functor: Functor<LazyHkt> = {
    map,
};

/**
 * The instance of `Monad` for `Lazy`.
 */
export const monad: Monad<LazyHkt> = {
    pure,
    map,
    flatMap,
    apply,
};

/**
 * The instance of `Monad` for `Traversable`.
 */
export const traversable: Traversable<LazyHkt> = {
    map,
    foldR,
    traverse,
};

export const enc = <T>(encT: Encoder<T>): Encoder<Lazy<T>> => (value) =>
    encT(force(value));
export const dec = <T>(decT: Decoder<T>): Decoder<Lazy<T>> =>
    mapDecoder((v: T) => defer(() => v))(decT);
