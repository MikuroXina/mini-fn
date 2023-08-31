import type { Apply2Only, Hkt2 } from "./hkt.js";
import type { MonadReader } from "./reader/monad.js";
import { type AbelianGroup, abelSymbol } from "./type-class/abelian-group.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Arrow } from "./type-class/arrow.js";
import type { Functor } from "./type-class/functor.js";
import { type Group } from "./type-class/group.js";
import type { Monad } from "./type-class/monad.js";
import { semiGroupSymbol } from "./type-class/semi-group.js";

/**
 * The type of function from `A` to `B`.
 */
export interface Fn<A, B> {
    (a: A): B;
}

/**
 * The identity function which returns the passed value as is.
 */
export const id = <T>(x: T) => x;

/**
 * The constant function which returns the first passed value.
 */
export const constant =
    <T>(x: T) =>
    <U>(_u: U) =>
        x;

/**
 * Indicates the unreachable code path. Calling this throws an error immediately, so this function should be called only if your application data is not consistent.
 */
export const absurd = <T>(): T => {
    throw new Error("PANIC: absurd must not be called");
};

/**
 * Composes two functions sequentially. `z = pipe(a)(b)(x)` means `y = a(x), z = b(y)`.
 *
 * @param firstDo - The function to do at first.
 * @param secondDo - The function to do at last.
 * @returns The composed function.
 */
export const pipe =
    <T, U>(firstDo: Fn<T, U>) =>
    <V>(secondDo: Fn<U, V>) =>
    (t: T) =>
        secondDo(firstDo(t));

/**
 * Composes two functions mathematically. `compose(f)(g)(x)` means `f(g(x))`.
 *
 * @param f - The function to do at last.
 * @param g - The function to do at first.
 * @returns The composed function.
 */
export const compose =
    <U, V>(f: Fn<U, V>) =>
    <T>(g: Fn<T, U>) =>
    (t: T) =>
        f(g(t));

/**
 * Flips two arguments of the function.
 *
 * @param f - The function with two arguments.
 * @returns The function flipped the arguments.
 */
export const flip =
    <T, U, V>(f: Fn<T, Fn<U, V>>): Fn<U, Fn<T, V>> =>
    (u) =>
    (t) =>
        f(t)(u);

/**
 * Repeats the `succ` operation until `pred` returns `true`.
 *
 * @param pred - The predicate whether the operation is done.
 * @param succ - The recursion successor of the operation.
 * @param init - The initial term of the operation.
 * @returns The found value while operations.
 */
export const until =
    <T>(pred: (t: T) => boolean) =>
    (succ: (t: T) => T): ((init: T) => T) => {
        const go = (x: T): T => {
            if (pred(x)) {
                return x;
            }
            return go(succ(x));
        };
        return go;
    };

/**
 * Maps the hom `X => A` with `f`.
 *
 * @param f - The function to map from `A`.
 * @param a - The hom to be mapped.
 * @returns The mapped hom.
 */
export const map =
    <X>() =>
    <A, B>(f: (a: A) => B) =>
    (a: Fn<X, A>): Fn<X, B> =>
        pipe(a)(f);

/**
 * Applies the hom `X => A => B` to another hom `X => A`.
 *
 * @param f - The hom returns the function to apply.
 * @param g - The hom to be applied.
 * @returns The applied hom.
 */
export const apply =
    <X>() =>
    <A, B>(f: Fn<X, (a: A) => B>) =>
    (g: Fn<X, A>): Fn<X, B> =>
    (x) =>
        f(x)(g(x));

/**
 * Lifts the binary operation `q` over the hom `X => _`.
 *
 * @param q - The binary operation takes `A` and `B`.
 * @param f - The hom `X => A`.
 * @param g - The hom `X => B`.
 * @returns The lifted hom `X => C`.
 */
export const liftBinary =
    <X>() =>
    <A, B, C>(q: (a: A) => (b: B) => C) =>
    (f: Fn<X, A>) =>
    (g: Fn<X, B>): Fn<X, C> =>
    (x) =>
        q(f(x))(g(x));

/**
 * Maps and flattens the hom with `fn`.
 *
 * @param fn - The function which maps from `A` to the hom `X => B`.
 * @param a - The hom `X => A`.
 * @returns The mapped hom `X => B`.
 */
export const flatMap =
    <X>() =>
    <A, B>(fn: (a: A) => Fn<X, B>) =>
    (a: Fn<X, A>): Fn<X, B> =>
    (x) =>
        fn(a(x))(x);

export interface FnHkt extends Hkt2 {
    readonly type: Fn<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Fn<E, _>`.
 */
export const functor = <E>(): Functor<Apply2Only<FnHkt, E>> => ({
    map: compose,
});

/**
 * The instance of `Applicative` for `Fn<X, _>`.
 */
export const applicative = <X>(): Applicative<Apply2Only<FnHkt, X>> => ({
    map: map(),
    pure: constant,
    apply: apply(),
});

/**
 * The instance of `Monad` for `Fn<X, _>`.
 */
export const monad = <X>(): Monad<Apply2Only<FnHkt, X>> => ({
    ...applicative(),
    flatMap: flatMap(),
});

/**
 * The instance of `MonadReader` for `Fn<R, _>`.
 */
export const monadReader = <R>(): MonadReader<R, Apply2Only<FnHkt, R>> => ({
    ...monad(),
    ask: () => id,
    local: pipe,
});

/**
 * The instance of `Arrow` for `Fn`. It is useful to construct the bifunctor with functions.
 */
export const fnArrow: Arrow<FnHkt> = {
    compose,
    identity: () => id,
    arr: id,
    split:
        (arrow1) =>
        (arrow2) =>
        ([b1, b2]) => [arrow1(b1), arrow2(b2)],
};

/**
 * @param gr - The instance of `Group` for `B`.
 * @returns The instance of `Group` for `Fn<A, B>`.
 */
export const group = <A, B>(gr: Group<B>): Group<Fn<A, B>> => ({
    combine: (l, r) => (a) => gr.combine(l(a), r(a)),
    identity: () => gr.identity,
    invert: (g) => (a) => gr.invert(g(a)),
    [semiGroupSymbol]: true,
});

/**
 * @param gr - The instance of `AbelianGroup` for `B`.
 * @returns The instance of `AbelianGroup` for `Fn<A, B>`.
 */
export const abelianGroup = <A, B>(gr: AbelianGroup<B>): AbelianGroup<Fn<A, B>> => ({
    combine: (l, r) => (a) => gr.combine(l(a), r(a)),
    identity: () => gr.identity,
    invert: (g) => (a) => gr.invert(g(a)),
    [semiGroupSymbol]: true,
    [abelSymbol]: true,
});
