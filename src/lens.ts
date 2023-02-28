import type { Get1, Get2, Hkt1, Hkt2 } from "./hkt.js";
import type { IdentityHkt } from "./identity.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Apply } from "./type-class/apply.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import type { Choice } from "./type-class/choice.js";
import type { Functor } from "./type-class/functor.js";
import { Profunctor, fnPro, leftMap } from "./type-class/profunctor.js";
import { Settable, taintedDot, untaintedDot } from "./type-class/settable.js";
import type { Contravariant } from "./type-class/variance.js";

export type LensLike<F, S, T, A, B> = (outer: (a: A) => Get1<F, B>) => (s: S) => Get1<F, T>;
export type LensLikeSimple<F, S, A> = LensLike<F, S, S, A, A>;

export type Over<P, F, S, T, A, B> = (g: Get2<P, A, Get1<F, B>>) => (s: S) => Get1<F, T>;
export type OverSimple<P, F, S, A> = Over<P, F, S, S, A, A>;

export interface Lens<S, T, A, B> {
    <F extends Hkt1>(functor: Functor<F>): LensLike<F, S, T, A, B>;
}
export type LensSimple<S, A> = Lens<S, S, A, A>;

export interface Traversal<S, T, A, B> {
    <F extends Hkt1>(applicative: Applicative<F>): LensLike<F, S, T, A, B>;
}
export type TraversalSimple<S, A> = Traversal<S, S, A, A>;

export interface Traversal1<S, T, A, B> {
    <F extends Hkt1>(applicative: Apply<F>): LensLike<F, S, T, A, B>;
}
export type Traversal1Simple<S, A> = Traversal1<S, S, A, A>;

export interface Setting<P, S, T, A, B> {
    (g: Get2<P, A, Get1<IdentityHkt, B>>): (s: S) => Get1<IdentityHkt, T>;
}
export type SettingSimple<P, S, A> = Setting<P, S, S, A, A>;

export interface Setter<S, T, A, B> {
    <F extends Hkt1>(settable: Settable<F>): LensLike<F, S, T, A, B>;
}
export type SetterSimple<S, A> = Setter<S, S, A, A>;

export interface Iso<S, T, A, B> {
    <P extends Hkt2, F extends Hkt1>(pro: Profunctor<P>, functor: Functor<F>): (
        g: Get2<P, A, Get1<F, B>>,
    ) => Get2<P, S, Get1<F, T>>;
}
export type IsoSimple<S, A> = Iso<S, S, A, A>;

export interface Review<T, B> {
    <P extends Hkt2, F extends Hkt1>(
        choice: Choice<P>,
        bi: Bifunctor<P>,
        settable: Settable<F>,
    ): OpticSimple<P, F, T, B>;
}

export interface Prism<S, T, A, B> {
    <P extends Hkt2, F extends Hkt1>(choice: Choice<P>, app: Applicative<F>): (
        g: Get2<P, A, Get1<F, B>>,
    ) => Get2<P, S, Get1<F, T>>;
}
export type PrismSimple<S, A> = Prism<S, S, A, A>;

export interface Equality<K1, K2, S extends K1, T extends K2, A extends K1, B extends K2> {
    <K3, P, F>(setter: (k1: K1) => (k3: K3) => void, getter: (k2: K2) => K3): (
        g: Get2<P, A, Get1<F, B>>,
    ) => Get2<P, S, Get1<F, T>>;
}
export type EqualitySimple<K, S extends K, A extends K> = Equality<K, K, S, S, A, A>;
export type As<K, A extends K> = EqualitySimple<K, A, A>;

export interface Getter<S, A> {
    <F extends Hkt1>(contra: Contravariant<F>, functor: Functor<F>): (
        g: (a: A) => Get1<F, A>,
    ) => (s: S) => Get1<F, S>;
}

export interface Fold<S, A> {
    <F extends Hkt1>(contra: Contravariant<F>, app: Applicative<F>): (
        g: (a: A) => Get1<F, A>,
    ) => (s: S) => Get1<F, S>;
}
export interface Fold1<S, A> {
    <F extends Hkt1>(contra: Contravariant<F>, app: Apply<F>): (
        g: (a: A) => Get1<F, A>,
    ) => (s: S) => Get1<F, S>;
}

export interface Optic<P, F, S, T, A, B> {
    (g: Get2<P, A, Get1<F, B>>): Get2<P, S, Get1<F, T>>;
}
export type OpticSimple<P, F, S, A> = Optic<P, F, S, S, A, A>;

export interface Optical<P, Q, F, S, T, A, B> {
    (g: Get2<P, A, Get1<F, B>>): Get2<Q, S, Get1<F, T>>;
}
export type OpticalSimple<P, Q, F, S, A> = Optical<P, Q, F, S, S, A, A>;

export const sets =
    <P extends Hkt2, Q extends Hkt2, F extends Hkt1>(
        proP: Profunctor<P>,
        proQ: Profunctor<Q>,
        settable: Settable<F>,
    ) =>
    <S, T, A, B>(f: (pab: Get2<P, A, B>) => Get2<Q, S, T>): Optical<P, Q, F, S, T, A, B> =>
    (g) =>
        taintedDot(settable)(proQ)(f(untaintedDot(settable)(proP)(g)));

export const mapped =
    <F extends Hkt1, A, B>(functor: Functor<F>): Setter<Get1<F, A>, Get1<F, B>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(functor.map);

export const contraMapped =
    <F extends Hkt1, A, B>(contra: Contravariant<F>): Setter<Get1<F, B>, Get1<F, A>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(contra.contraMap);

export const argument =
    <P extends Hkt2, A, B, R>(pro: Profunctor<P>): Setter<Get2<P, B, R>, Get2<P, A, R>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(leftMap(pro));
