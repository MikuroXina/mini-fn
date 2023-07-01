import {
    type Const,
    type ConstHkt,
    functor as constFunctor,
    get as getConst,
    newConst,
} from "./const.js";
import { fnArrow, monadReader as fnMonadReader, pipe } from "./func.js";
import type { Apply2Only, Get1, Get2 } from "./hkt.js";
import { type IdentityHkt, functor as identityFunctor } from "./identity.js";
import { type MonadReader, reader } from "./reader/monad.js";
import { type MonadState, gets as monadStateGets } from "./state/monad.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Apply } from "./type-class/apply.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import type { Choice } from "./type-class/choice.js";
import type { Functor } from "./type-class/functor.js";
import { type Profunctor, fnPro, leftMap } from "./type-class/profunctor.js";
import { type Settable, taintedDot, untaintedDot } from "./type-class/settable.js";
import type { Contravariant } from "./type-class/variance.js";

export * as Bizarre from "./lens/bizarre.js";

export type LensLike<F, S, T, A, B> = (outer: (a: A) => Get1<F, B>) => (s: S) => Get1<F, T>;
export type LensLikeSimple<F, S, A> = LensLike<F, S, S, A, A>;

export type Over<P, F, S, T, A, B> = (g: Get2<P, A, Get1<F, B>>) => (s: S) => Get1<F, T>;
export type OverSimple<P, F, S, A> = Over<P, F, S, S, A, A>;

export interface Lens<S, T, A, B> {
    <F>(functor: Functor<F>): LensLike<F, S, T, A, B>;
}
export type LensSimple<S, A> = Lens<S, S, A, A>;

export interface Traversal<S, T, A, B> {
    <F>(applicative: Applicative<F>): LensLike<F, S, T, A, B>;
}
export type TraversalSimple<S, A> = Traversal<S, S, A, A>;

export interface Traversal1<S, T, A, B> {
    <F>(applicative: Apply<F>): LensLike<F, S, T, A, B>;
}
export type Traversal1Simple<S, A> = Traversal1<S, S, A, A>;

export interface Setting<P, S, T, A, B> {
    (g: Get2<P, A, Get1<IdentityHkt, B>>): (s: S) => Get1<IdentityHkt, T>;
}
export type SettingSimple<P, S, A> = Setting<P, S, S, A, A>;

export interface Setter<S, T, A, B> {
    <F>(settable: Settable<F>): LensLike<F, S, T, A, B>;
}
export type SetterSimple<S, A> = Setter<S, S, A, A>;

export type ASetter<S, T, A, B> = LensLike<IdentityHkt, S, T, A, B>;
export type ASetterSimple<S, A> = ASetter<S, S, A, A>;

export const asASetter = <S, T, A, B>(lens: Lens<S, T, A, B>): ASetter<S, T, A, B> =>
    lens(identityFunctor);

export interface Iso<S, T, A, B> {
    <P, F>(pro: Profunctor<P>, functor: Functor<F>): (
        g: Get2<P, A, Get1<F, B>>,
    ) => Get2<P, S, Get1<F, T>>;
}
export type IsoSimple<S, A> = Iso<S, S, A, A>;

export interface Review<T, B> {
    <P, F>(choice: Choice<P>, bi: Bifunctor<P>, settable: Settable<F>): OpticSimple<P, F, T, B>;
}

export interface Prism<S, T, A, B> {
    <P, F>(choice: Choice<P>, app: Applicative<F>): (
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
    <F>(contra: Contravariant<F>, functor: Functor<F>): LensLikeSimple<F, S, A>;
}

export type Getting<R, S, A> = LensLikeSimple<Apply2Only<ConstHkt, R>, S, A>;
export type Accessing<P, M, S, A> = (outer: Get2<P, A, Const<M, A>>) => (s: S) => Const<M, S>;

export const asGetting = <S, T, A, B>(lens: Lens<S, T, A, B>): Getting<A, S, A> =>
    lens(constFunctor<A>());

export interface Fold<S, A> {
    <F>(contra: Contravariant<F>, app: Applicative<F>): (
        g: (a: A) => Get1<F, A>,
    ) => (s: S) => Get1<F, S>;
}
export interface Fold1<S, A> {
    <F>(contra: Contravariant<F>, app: Apply<F>): (g: (a: A) => Get1<F, A>) => (s: S) => Get1<F, S>;
}

export interface Optic<P, F, S, T, A, B> {
    (g: Get2<P, A, Get1<F, B>>): Get2<P, S, Get1<F, T>>;
}
export type OpticSimple<P, F, S, A> = Optic<P, F, S, S, A, A>;

export interface Optical<P, Q, F, S, T, A, B> {
    (g: Get2<P, A, Get1<F, B>>): Get2<Q, S, Get1<F, T>>;
}
export type OpticalSimple<P, Q, F, S, A> = Optical<P, Q, F, S, S, A, A>;

export const fromGetSet =
    <S, A>(getter: (store: S) => A) =>
    (setter: (store: S) => (newValue: A) => S): LensSimple<S, A> =>
    <F>(functor: Functor<F>): LensLikeSimple<F, S, A> =>
    (fn) =>
    (store) =>
        functor.map(setter(store))(fn(getter(store)));

export const set =
    <S, T, A, B>(l: ASetter<S, T, A, B>) =>
    (b: B): ((s: S) => T) =>
        l(() => b);
export const setSimple =
    <S, A>(l: ASetterSimple<S, A>) =>
    (b: A): ((s: S) => S) =>
        l(() => b);

export const sets =
    <P, Q, F>(proP: Profunctor<P>, proQ: Profunctor<Q>, settable: Settable<F>) =>
    <S, T, A, B>(f: (pab: Get2<P, A, B>) => Get2<Q, S, T>): Optical<P, Q, F, S, T, A, B> =>
    (g) =>
        taintedDot(settable)(proQ)(f(untaintedDot(settable)(proP)(g)));

export const view =
    <S, M>(mr: MonadReader<S, M>) =>
    <A>(l: Getting<A, S, A>): Get1<M, A> =>
        reader(mr)(fnArrow.compose<Const<A, A>, A>(getConst)<S>(l(newConst)));

export const views =
    <S, M>(mr: MonadReader<S, M>) =>
    <R, A>(l: LensLikeSimple<Apply2Only<ConstHkt, R>, S, A>) =>
    (fn: (a: A) => R): Get1<M, R> =>
        reader(mr)((s: S) => l(pipe(fn)(newConst))(s).getConst);

export const get =
    <S, A>(l: Getting<A, S, A>) =>
    (s: S): A =>
        getConst(l(newConst)(s));

export const use =
    <S, M>(ms: MonadState<S, M>) =>
    <A>(l: Getting<A, S, A>): Get1<M, A> =>
        monadStateGets(ms)(view(fnMonadReader<S>())(l));

export const uses =
    <S, M>(ms: MonadState<S, M>) =>
    <R, A>(l: LensLikeSimple<Apply2Only<ConstHkt, R>, S, A>) =>
    (fn: (a: A) => R): Get1<M, R> =>
        monadStateGets(ms)(views(fnMonadReader<S>())(l)(fn));

export const mapped =
    <F, A, B>(functor: Functor<F>): Setter<Get1<F, A>, Get1<F, B>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(functor.map);

export const contraMapped =
    <F, A, B>(contra: Contravariant<F>): Setter<Get1<F, B>, Get1<F, A>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(contra.contraMap);

export const argument =
    <P, A, B, R>(pro: Profunctor<P>): Setter<Get2<P, B, R>, Get2<P, A, R>, A, B> =>
    (settable) =>
        sets(fnPro, fnPro, settable)(leftMap(pro));
