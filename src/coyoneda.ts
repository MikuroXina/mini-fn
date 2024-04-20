import { type Exists, newExists, runExists } from "./exists.ts";
import type { Apply2Only, Apply3Only, Get1, Hkt2, Hkt3 } from "./hkt.ts";
import { collect, type Distributive } from "./type-class/distributive.ts";
import type { Applicative } from "./type-class/applicative.ts";
import type { Apply } from "./type-class/apply.ts";
import { type Comonad, extend } from "./type-class/comonad.ts";
import type { Foldable } from "./type-class/foldable.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monad } from "./type-class/monad.ts";
import type { Pure } from "./type-class/pure.ts";
import type { Traversable } from "./type-class/traversable.ts";

/**
 * Calculation on a space `X` and mapping function from `X` to an inclusion space `A`.
 */
export type CoyonedaT<F, A, X> = [map: (shape: X) => A, image: Get1<F, X>];

export interface CoyonedaTHkt extends Hkt3 {
    readonly type: CoyonedaT<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * Coyoneda functor, a dual of Yoneda functor reduction. It is also known as presheaf.
 */
export type Coyoneda<F, A> = Exists<Apply2Only<Apply3Only<CoyonedaTHkt, F>, A>>;

export interface CoyonedaHkt extends Hkt2 {
    readonly type: Coyoneda<this["arg2"], this["arg1"]>;
}

/**
 * Creates a new `Coyoneda` from mapping function `map` and calculation on `F`.
 *
 * @param map - A mapping function from `A` to `B`.
 * @param image - A calculation that results `A` on `F`.
 * @returns A new `Coyoneda`.
 */
export const coyoneda =
    <A, B>(map: (a: A) => B) => <F>(image: Get1<F, A>): Coyoneda<F, B> =>
        newExists<Coyoneda<F, B>, A>([map, image]);

/**
 * Unwraps a `Coyoneda` with running `runner`.
 *
 * @param runner - An extracting function.
 * @returns The result of `runner`.
 */
export const unCoyoneda =
    <F, A, R>(runner: <X>(map: (shape: X) => A) => (image: Get1<F, X>) => R) =>
    (coy: Coyoneda<F, A>): R =>
        runExists<Coyoneda<F, A>, R>(<X>([map, image]: CoyonedaT<F, A, X>) =>
            runner(map)(image)
        )(coy);

/**
 * Lifts the presheaf as a `Coyoneda`.
 *
 * @param fa - The presheaf to be expanded.
 * @returns The new expanded instance.
 */
export const lift = <F, A>(fa: Get1<F, A>): Coyoneda<F, A> =>
    coyoneda((x: A) => x)(fa);

/**
 * Lowers `coy` on a presheaf.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param coy - The instance to be reduced.
 * @returns The reduction on a presheaf.
 */
export const lower =
    <F>(functor: Functor<F>) => <A>(coy: Coyoneda<F, A>): Get1<F, A> =>
        unCoyoneda(functor.map)(coy);

/**
 * Lifts the natural transformation from `F` to `G` on `Coyoneda`.
 *
 * @param nat - The natural transformation to be lifted.
 * @returns The lifted transformation.
 */
export const hoist =
    <F, G>(nat: <A>(fa: Get1<F, A>) => Get1<G, A>) =>
    <A>(coy: Coyoneda<F, A>): Coyoneda<G, A> =>
        runExists<Coyoneda<F, A>, Coyoneda<G, A>>(([map, image]) =>
            coyoneda(map)(nat(image))
        )(coy);

export const pureT = <F>(pure: Pure<F>) => <T>(item: T): Coyoneda<F, T> =>
    lift(pure.pure(item));

/**
 * Maps the function into an function on `Coyoneda`.
 *
 * @param fn - The function from `T` to `U`.
 * @returns The mapped function.
 */
export const map =
    <T, U>(fn: (t: T) => U) => <F>(coy: Coyoneda<F, T>): Coyoneda<F, U> =>
        runExists<Coyoneda<F, T>, Coyoneda<F, U>>(<A>(
            [map, image]: CoyonedaT<F, T, A>,
        ) => coyoneda((t: A) => fn(map(t)))(image))(coy);

export const applyT =
    <F>(apply: Apply<F>) =>
    <T, U>(fn: Coyoneda<F, (t: T) => U>) =>
    (coy: Coyoneda<F, T>): Coyoneda<F, U> =>
        lift(apply.apply(lower(apply)(fn))(lower(apply)(coy)));

export const flatMapT =
    <F>(flatMap: Monad<F>) =>
    <T, U>(fn: (t: T) => Coyoneda<F, U>) =>
    (coy: Coyoneda<F, T>): Coyoneda<F, U> =>
        lift(
            runExists<Coyoneda<F, T>, Get1<F, U>>(<A>(
                [map, image]: CoyonedaT<F, T, A>,
            ) => flatMap.flatMap(
                (x: A) => lower(flatMap)(fn(map(x))),
            )(image))(coy),
        );

export const duplicateT =
    <F>(comonad: Comonad<F>) =>
    <T>(coy: Coyoneda<F, T>): Coyoneda<F, Coyoneda<F, T>> =>
        runExists<Coyoneda<F, T>, Coyoneda<F, Coyoneda<F, T>>>(<A>(
            [map, image]: CoyonedaT<F, T, A>,
        ) => lift(extend(comonad)((x: Get1<F, A>) => coyoneda(map)(x))(image)))(
            coy,
        );

export const extractT =
    <F>(comonad: Comonad<F>) => <T>(coy: Coyoneda<F, T>): T =>
        runExists<Coyoneda<F, T>, T>(([map, image]) =>
            map(comonad.extract(image))
        )(coy);

export const foldRT =
    <F>(foldable: Foldable<F>) =>
    <A, B>(folder: (next: A) => (acc: B) => B) =>
    (init: B): (data: Coyoneda<F, A>) => B =>
        unCoyoneda(
            <X>(map: (x: X) => A) =>
                foldable.foldR((next: X) => folder(map(next)))(init),
        );

export const traverseT =
    <T>(tra: Traversable<T>) =>
    <F>(app: Applicative<F>) =>
    <A, B>(
        visitor: (item: A) => Get1<F, B>,
    ): (data: Coyoneda<T, A>) => Get1<F, Coyoneda<T, B>> =>
        unCoyoneda(<X>(map: (x: X) => A) => (image: Get1<T, X>) =>
            app.map(lift)(tra.traverse(app)((a: X) => visitor(map(a)))(image))
        );

export const distributeT =
    <G>(dist: Distributive<G>) =>
    <F>(functor: Functor<F>) =>
    <A>(fga: Get1<F, Coyoneda<G, A>>): Coyoneda<G, Get1<F, A>> =>
        lift(collect(dist)(functor)(lower(dist))(fga));

/**
 * The instance of `Functor` for `Coyoneda`.
 */
export const functor: Functor<CoyonedaHkt> = { map };

export const applicative = <F>(
    app: Applicative<F>,
): Applicative<Apply2Only<CoyonedaHkt, F>> => ({
    pure: pureT(app),
    map,
    apply: applyT(app),
});

export const monad = <F>(
    monad: Monad<F>,
): Monad<Apply2Only<CoyonedaHkt, F>> => ({
    pure: pureT(monad),
    map,
    apply: applyT(monad),
    flatMap: flatMapT(monad),
});

export const comonad = <F>(
    comonad: Comonad<F>,
): Comonad<Apply2Only<CoyonedaHkt, F>> => ({
    map,
    extract: extractT(comonad),
    duplicate: duplicateT(comonad),
});

export const foldable = <F>(
    foldable: Foldable<F>,
): Foldable<Apply2Only<CoyonedaHkt, F>> => ({ foldR: foldRT(foldable) });

export const traversable = <T>(
    tra: Traversable<T>,
): Traversable<Apply2Only<CoyonedaHkt, T>> => ({
    map,
    foldR: foldRT(tra),
    traverse: traverseT(tra),
});

export const distributive = <G>(
    dist: Distributive<G>,
): Distributive<Apply2Only<CoyonedaHkt, G>> => ({
    map,
    distribute: distributeT(dist),
});
