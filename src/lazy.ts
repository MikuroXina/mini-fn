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

const lazyNominal = Symbol("Lazy");

/**
 * The lazy evaluated value of type `L`. It is useful to improve that evaluating the data structure eagerly produces infinite recursion.
 *
 * The key of the field having the function is private, so you need to evaluate the value by `force` function.
 */
export interface Lazy<L> {
    readonly [lazyNominal]: () => L;
}

/**
 * Makes the function into `Lazy` to defer the evaluation.
 *
 * @param deferred - The function to be contained.
 * @returns The new `Lazy`.
 */
export const defer = <L>(deferred: () => L): Lazy<L> => ({
    [lazyNominal]: deferred,
});

/**
 * Force to evaluate the value of `Lazy`, by calling the contained function.
 *
 * @param lazy - The instance of `Lazy`.
 * @returns The evaluated value.
 */
export const force = <L>(lazy: Lazy<L>): L => lazy[lazyNominal]();

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
export const pure = <A>(a: A): Lazy<A> => defer(() => a);
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
