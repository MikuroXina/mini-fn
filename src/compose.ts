/**
 * This module provides a composing functor, `Compose<F, G, _>`.
 *
 * @packageDocumentation
 * @module
 */

import type { Apply2Only, Apply3Only, Get1, Hkt3 } from "./hkt.ts";
import { type Applicative, liftA2 } from "./type-class/applicative.ts";
import { collect, type Distributive } from "./type-class/distributive.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Traversable } from "./type-class/traversable.ts";

/**
 * Right to left composition of `F` and `G` functors.
 */
export type Compose<F, G, T> = Get1<F, Get1<G, T>>;

export interface ComposeHkt extends Hkt3 {
    readonly type: Compose<this["arg3"], this["arg2"], this["arg1"]>;
}

export const newCompose = <F, G, T>(
    fgt: Get1<F, Get1<G, T>>,
): Compose<F, G, T> => fgt;
export const getCompose = <F, G, T>(c: Compose<F, G, T>): Get1<F, Get1<G, T>> =>
    c;

export const map =
    <F, G>(f: Functor<F>, g: Functor<G>) =>
    <T, U>(fn: (t: T) => U): (t: Compose<F, G, T>) => Compose<F, G, U> =>
        f.map(g.map(fn));

/**
 * Composes the two functors into a new one.
 *
 * @param f - The `Functor` instance for `F`.
 * @param g - The `Functor` instance for `G`.
 * @returns The composed functor.
 */
export const functor =
    <F>(f: Functor<F>) =>
    <G>(g: Functor<G>): Functor<Apply2Only<Apply3Only<ComposeHkt, F>, G>> => ({
        map: map(f, g),
    });

/**
 * Composes the two applicative functors into a new one.
 *
 * @param f - The `Applicative` instance for `F`.
 * @param g - The `Applicative` instance for `G`.
 * @returns The composed applicative functor.
 */
export const applicative = <F>(f: Applicative<F>) =>
<G>(
    g: Applicative<G>,
): Applicative<Apply2Only<Apply3Only<ComposeHkt, F>, G>> => ({
    pure: (t) => f.pure(g.pure(t)),
    map: map(f, g),
    apply: liftA2(f)(g.apply),
});

/**
 * Composes the two composing operators into a new one.
 *
 * @param f - The `Foldable` instance for `F`.
 * @param g - The `Foldable` instance for `G`.
 * @returns The composed folding operator.
 */
export const foldable = <F>(f: Foldable<F>) =>
<G>(
    g: Foldable<G>,
): Foldable<Apply2Only<Apply3Only<ComposeHkt, F>, G>> => ({
    foldR: <A, B>(folder: (next: A) => (acc: B) => B) =>
        f.foldR((ga: Get1<G, A>) => (acc: B) => g.foldR(folder)(acc)(ga)),
});

/**
 * Composes the two traversable functors into a new one.
 *
 * @param f - The `Traversable` instance for `F`.
 * @param g - The `Traversable` instance for `G`.
 * @returns The composed traversable functor.
 */
export const traversable = <F>(f: Traversable<F>) =>
<G>(
    g: Traversable<G>,
): Traversable<Apply2Only<Apply3Only<ComposeHkt, F>, G>> => ({
    map: map(f, g),
    foldR: <A, B>(folder: (next: A) => (acc: B) => B) =>
        f.foldR((ga: Get1<G, A>) => (acc: B) => g.foldR(folder)(acc)(ga)),
    traverse: (app) => (visitor) => f.traverse(app)(g.traverse(app)(visitor)),
});

export const distributive = <F, G>(
    distributiveF: Distributive<F>,
    distributiveG: Distributive<G>,
): Distributive<Apply2Only<Apply3Only<ComposeHkt, F>, G>> => ({
    map: map(distributiveF, distributiveG),
    distribute:
        <S>(functor: Functor<S>) =>
        <T>(fga: Get1<S, Compose<F, G, T>>): Compose<F, G, Get1<S, T>> =>
            distributiveF.map(distributiveG.distribute(functor))(
                collect(distributiveF)(functor)(getCompose<F, G, T>)(fga),
            ),
});
