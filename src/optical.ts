import type { FnHkt } from "./func.js";
import type { Get1, Get2, Hkt5 } from "./hkt.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import type { Choice } from "./type-class/choice.js";
import type { Conjoined } from "./type-class/conjoined.js";
import { type Functor } from "./type-class/functor.js";
import type { Indexable } from "./type-class/indexable.js";
import { type Profunctor } from "./type-class/profunctor.js";
import { type Settable } from "./type-class/settable.js";
import type { Contravariant } from "./type-class/variance.js";

export * as Getting from "./optical/getting.js";
export * as Setter from "./optical/setter.js";

export interface OpticalCat<Ctx> {
    readonly focus: <P, Q, F, S, T, A, B>(optical: Optical<P, Q, F, S, T, A, B>) => OpticalCat<Ctx>;
    readonly get: () => Ctx;
    readonly set: (newValue: Ctx) => Ctx;
}

export type Optical<P, Q, F, S, T, A, B> = (paFb: Get2<P, A, Get1<F, B>>) => Get2<Q, S, Get1<F, T>>;
export type OpticalSimple<P, Q, F, S, A> = Optical<P, Q, F, S, S, A, A>;

export const compose =
    <P, Q, R, F, V, W, S, T, A, B>(b: Optical<Q, R, F, V, W, S, T>) =>
    (a: Optical<P, Q, F, S, T, A, B>): Optical<P, R, F, V, W, A, B> =>
    (paFb) =>
        b(a(paFb));

export type Optic<P, F, S, T, A, B> = Optical<P, P, F, S, T, A, B>;
export type OpticSimple<P, F, S, A> = Optic<P, F, S, S, A, A>;

export type Over<P, F, S, T, A, B> = Optical<P, FnHkt, F, S, T, A, B>;
export type OverSimple<P, F, S, A> = Over<P, F, S, S, A, A>;

export type LensLike<F, S, T, A, B> = Optic<FnHkt, F, S, T, A, B>;
export type LensLikeSimple<F, S, A> = LensLike<F, S, S, A, A>;
export type IndexedLensLike<I, F, S, T, A, B> = <P>(f: Indexable<I, P>) => Over<P, F, S, T, A, B>;
export type IndexedLensLikeSimple<I, F, S, A> = IndexedLensLike<I, F, S, S, A, A>;

export interface LensLikeHkt extends Hkt5 {
    readonly type: LensLike<this["arg5"], this["arg4"], this["arg3"], this["arg2"], this["arg1"]>;
}

export type Equality<S, T, A, B> = <P, F>() => Optic<P, F, S, T, A, B>;
export type EqualitySimple<S, A> = Equality<S, S, A, A>;
export type As<A> = EqualitySimple<A, A>;

export type Iso<S, T, A, B> = <P, F>(f: Profunctor<P> & Functor<F>) => Optic<P, F, S, T, A, B>;
export type IsoSimple<S, A> = Iso<S, S, A, A>;

export type Lens<S, T, A, B> = <F>(f: Functor<F>) => Optic<FnHkt, F, S, T, A, B>;
export type LensSimple<S, A> = Lens<S, S, A, A>;
export type IndexedLens<I, S, T, A, B> = <F, P>(
    f: Indexable<I, P> & Functor<F>,
) => Over<P, F, S, T, A, B>;
export type IndexedLensSimple<I, S, A> = IndexedLens<I, S, S, A, A>;
export type IndexPreservingLens<S, T, A, B> = <P, F>(
    f: Conjoined<P> & Functor<F>,
) => Optical<P, P, F, S, T, A, B>;
export type IndexPreservingLensSimple<S, A> = IndexPreservingLens<S, S, A, A>;

export type Traversal<S, T, A, B> = <F>(f: Applicative<F>) => Optic<FnHkt, F, S, T, A, B>;
export type TraversalSimple<S, A> = Traversal<S, S, A, A>;
export type IndexedTraversal<I, S, T, A, B> = <P, F>(
    f: Indexable<I, P> & Applicative<F>,
) => Over<P, F, S, T, A, B>;
export type IndexedTraversalSimple<I, S, A> = IndexedTraversal<I, S, S, A, A>;
export type IndexPreservingTraversal<S, T, A, B> = <P, F>(
    f: Conjoined<P> & Applicative<F>,
) => Optic<P, F, S, T, A, B>;
export type IndexPreservingTraversalSimple<S, A> = IndexPreservingTraversal<S, S, A, A>;

export type Getter<S, A> = <F>(f: Contravariant<F> & Functor<F>) => Optic<FnHkt, F, S, S, A, A>;
export type IndexedGetter<I, S, A> = <P, F>(
    f: Indexable<I, P> & Contravariant<F> & Functor<F>,
) => OverSimple<P, F, S, A>;
export type IndexPreservingGetter<S, A> = <P, F>(
    f: Conjoined<P> & Contravariant<F> & Functor<F>,
) => Optic<P, F, S, S, A, A>;

export type Review<T, B> = <P, F>(
    f: Choice<P> & Bifunctor<P> & Settable<F>,
) => OpticSimple<P, F, T, B>;

export type Prism<S, T, A, B> = <P, F>(f: Choice<P> & Applicative<F>) => Optic<P, F, S, T, A, B>;
export type PrismSimple<S, A> = Prism<S, S, A, A>;

export type Fold<S, A> = <F>(f: Contravariant<F> & Applicative<F>) => Optic<FnHkt, F, S, S, A, A>;
export type IndexedFold<I, S, A> = <P, F>(
    f: Indexable<I, P> & Contravariant<F> & Applicative<F>,
) => OverSimple<P, F, S, A>;
export type IndexPreservingFold<S, A> = <P, F>(
    f: Conjoined<P> & Contravariant<F> & Applicative<F>,
) => Optic<P, F, S, S, A, A>;
