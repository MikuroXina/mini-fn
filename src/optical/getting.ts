import { type Const, type ConstHkt, get, newConst } from "../const.js";
import { constant, monadReader } from "../func.js";
import type { Apply2Only, Get1, Get2 } from "../hkt.js";
import type {
    LensLikeSimple,
    Optical,
    OpticalSimple,
    OpticSimple,
    OverSimple,
} from "../optical.js";
import { type MonadReader, reader } from "../reader/monad.js";
import { gets, type MonadState } from "../state/monad.js";
import { uncurry } from "../tuple.js";
import type { Functor } from "../type-class/functor.js";
import type { Indexable } from "../type-class/indexable.js";
import type { Indexed } from "../type-class/indexed.js";
import { fnPro, type Profunctor, rightMap } from "../type-class/profunctor.js";
import { type Contravariant, phantom } from "../type-class/variance.js";
import type { MonadWriter } from "../writer/monad.js";

export type Getting<R, S, A> = (f: (a: A) => Const<R, A>) => (s: S) => Const<R, S>;
export type IndexedGetting<I, M, S, A> = (f: Indexed<I, A, Const<M, A>>) => (s: S) => Const<M, S>;

export type Accessing<P, M, S, A> = (f: Get2<P, A, Const<M, A>>) => (s: S) => Const<M, S>;

export const getting =
    <P, Q, F>(pPro: Profunctor<P>, qPro: Profunctor<Q>, f: Functor<F>, c: Contravariant<F>) =>
    <S, T, A, B>(l: Optical<P, Q, F, S, T, A, B>): OpticalSimple<P, Q, F, S, A> =>
    (paFa: Get2<P, A, Get1<F, A>>): Get2<Q, S, Get1<F, S>> =>
        rightMap(qPro)<Get1<F, T>, Get1<F, S>>(phantom(f, c))(
            l(rightMap(pPro)<Get1<F, A>, Get1<F, B>>(phantom(f, c))(paFa)),
        );

export const to =
    <P, F>(p: Profunctor<P>, c: Contravariant<F>) =>
    <S, A>(k: (s: S) => A): OpticSimple<P, F, S, A> =>
        p.diMap(k)(c.contraMap(k));

export const iTo =
    <I, P, F>(i: Indexable<I, P>, c: Contravariant<F>) =>
    <S, A>(k: (s: S) => [I, A]): OverSimple<P, F, S, A> =>
    (paFa) =>
        fnPro.diMap(k)(c.contraMap((s: S) => k(s)[1]))(uncurry(i.indexed(paFa)));

export const like =
    <P, F>(p: Profunctor<P>, f: Contravariant<F> & Functor<F>) =>
    <S, A>(a: A): OpticSimple<P, F, S, A> =>
        to(p, f)(constant(a));

export const iLike =
    <I, P, F>(p: Indexable<I, P>, f: Contravariant<F> & Functor<F>) =>
    (i: I) =>
    <S, A>(a: A): OverSimple<P, F, S, A> =>
        iTo(p, f)(constant([i, a]));

export const viewFolding =
    <S>(s: S) =>
    <A>(l: Getting<A, S, A>): A =>
        get(l(newConst)(s));

export const viewIndex =
    <S>(s: S) =>
    <I, A>(l: IndexedGetting<I, [I, A], S, A>): [I, A] =>
        get(l((i) => (a) => newConst([i, a]))(s));

// for MonadReader:

export const view =
    <S, M>(mr: MonadReader<S, M>) =>
    <A>(l: Getting<A, S, A>): Get1<M, A> =>
        reader(mr)((s) => get(l(newConst)(s)));

export const views =
    <S, M>(mr: MonadReader<S, M>) =>
    <A, R>(l: LensLikeSimple<Apply2Only<ConstHkt, R>, S, A>) =>
    (f: (a: A) => R): Get1<M, R> =>
        reader(mr)((s) => get(l((a) => newConst(f(a)))(s)));

export const iView =
    <S, M>(mr: MonadReader<S, M>) =>
    <I, A>(l: IndexedGetting<I, [I, A], S, A>): Get1<M, [I, A]> =>
        reader(mr)((s) => get(l((i) => (a) => newConst([i, a]))(s)));

export const iViews =
    <S, M>(mr: MonadReader<S, M>) =>
    <I, R, A>(l: IndexedGetting<I, R, S, A>) =>
    (f: (i: I) => (a: A) => R): Get1<M, R> =>
        reader(mr)((s) => get(l((i) => (a) => newConst(f(i)(a)))(s)));

// for MonadState:

export const use =
    <S, M>(ms: MonadState<S, M>) =>
    <A>(l: Getting<A, S, A>): Get1<M, A> =>
        gets(ms)(view(monadReader<S>())(l));

export const iUse =
    <S, M>(ms: MonadState<S, M>) =>
    <I, A>(l: IndexedGetting<I, [I, A], S, A>): Get1<M, [I, A]> =>
        gets(ms)((s) => get(l((i) => (a) => newConst([i, a]))(s)));

export const iUses =
    <S, M>(ms: MonadState<S, M>) =>
    <I, R, A>(l: IndexedGetting<I, R, S, A>) =>
    (f: (i: I) => (a: A) => R): Get1<M, R> =>
        gets(ms)((s) => get(l((i) => (a) => newConst(f(i)(a)))(s)));

// for MonadWriter:

export const listening =
    <W, M>(mw: MonadWriter<W, M>) =>
    <U>(l: Getting<U, W, U>) =>
    <A>(m: Get1<M, A>): Get1<M, [A, U]> =>
        mw.map(([a, w]: [A, W]) => [a, view(monadReader<W>())(l)(w)])(mw.listen(m));

export const iListening =
    <W, M>(mw: MonadWriter<W, M>) =>
    <I, U>(l: IndexedGetting<I, [I, U], W, U>) =>
    <A>(m: Get1<M, A>): Get1<M, [A, [I, U]]> =>
        mw.map(([a, w]: [A, W]) => [a, iView(monadReader<W>())(l)(w)])(mw.listen(m));

export const listenings =
    <W, M>(mw: MonadWriter<W, M>) =>
    <V, U>(l: Getting<V, W, U>) =>
    (uv: (u: U) => V) =>
    <A>(m: Get1<M, A>): Get1<M, [A, V]> =>
        mw.map(([a, w]: [A, W]) => [a, views(monadReader<W>())(l)(uv)(w)])(mw.listen(m));

export const iListenings =
    <W, M>(mw: MonadWriter<W, M>) =>
    <I, V, U>(l: IndexedGetting<I, V, W, U>) =>
    (iuv: (i: I) => (u: U) => V) =>
    <A>(m: Get1<M, A>): Get1<M, [A, V]> =>
        mw.map(([a, w]: [A, W]) => [a, iViews(monadReader<W>())(l)(iuv)(w)])(mw.listen(m));
