import { compose, constant, flip, type Fn, type FnHkt } from "../func.js";
import type { Apply3Only, Get1, Get2, Get3 } from "../hkt.js";
import { id, type IdentityHkt, settable as identitySettable } from "../identity.js";
import type { Optic, Optical, Over } from "../optical.js";
import { type Option, some } from "../option.js";
import type { MonadReader } from "../reader/monad.js";
import { modify, type MonadState } from "../state/monad.js";
import { uncurry } from "../tuple.js";
import { type Arrow, fanOut } from "../type-class/arrow.js";
import type { Conjoined } from "../type-class/conjoined.js";
import type { ApplyCorep, Corep } from "../type-class/corepresentable.js";
import { type Functor, replace } from "../type-class/functor.js";
import { type Indexable } from "../type-class/indexable.js";
import { type IndexedHkt } from "../type-class/indexed.js";
import { liftM, type Monad } from "../type-class/monad.js";
import type { Monoid } from "../type-class/monoid.js";
import { fnPro, leftMap, type Profunctor } from "../type-class/profunctor.js";
import type { SemiGroup } from "../type-class/semi-group.js";
import { type Settable, taintedDot, untaintedDot } from "../type-class/settable.js";
import type { Contravariant } from "../type-class/variance.js";
import { censor, type MonadWriter } from "../writer/monad.js";

export type Setter<S, T, A, B> = <F>(f: Settable<F>) => Optic<FnHkt, F, S, T, A, B>;
export type SetterSimple<S, A> = Setter<S, S, A, A>;
export type IndexedSetter<I, S, T, A, B> = <F, P>(
    i: Indexable<I, P>,
    f: Settable<F>,
) => Over<P, F, S, T, A, B>;
export type IndexedSetterSimple<I, S, A> = IndexedSetter<I, S, S, A, A>;
export type IndexPreservingSetter<S, T, A, B> = <P, F>(
    f: Conjoined<ApplyCorep<P, S>> & Settable<F>,
) => Optic<P, F, S, T, A, B>;
export type IndexPreservingSetterSimple<S, A> = IndexPreservingSetter<S, S, A, A>;

export type ASetter<S, T, A, B> = Optic<FnHkt, IdentityHkt, S, T, A, B>;
export type ASetterSimple<S, A> = ASetter<S, S, A, A>;
export type AnIndexedSetter<I, S, T, A, B> = Optical<
    Apply3Only<IndexedHkt, I>,
    FnHkt,
    IdentityHkt,
    S,
    T,
    A,
    B
>;
export type AnIndexedSetterSimple<I, S, A> = AnIndexedSetter<I, S, S, A, A>;

export const sets =
    <P, Q, F>(p: Profunctor<P>, q: Profunctor<Q>, s: Settable<F>) =>
    <A, B, S, T>(f: Fn<Get2<P, A, B>, Get2<Q, S, T>>): Optical<P, Q, F, S, T, A, B> =>
    (g) =>
        taintedDot(s)(q)(f(untaintedDot(s)(p)(g)));

export const cloneSetter =
    <S, T, A, B>(l: ASetter<S, T, A, B>): Setter<S, T, A, B> =>
    (f) =>
    (afb) =>
        taintedDot(f)(fnPro)(l(untaintedDot(f)(fnPro)(afb)));

export const cloneIndexPreservingSetter =
    <S, T, A, B>(l: ASetter<S, T, A, B>): IndexPreservingSetter<S, T, A, B> =>
    <P, F>(f: Conjoined<ApplyCorep<P, S>> & Settable<F>) =>
    (paFb: Get2<P, A, Get1<F, B>>) =>
        f.cotabulate((ws) =>
            taintedDot(f)(fnPro)(
                l((ab) => f.untainted(f.coindex(paFb)(replace<Corep<P>>(f)(ab)(ws)))),
            )(f.extract(ws)),
        );

export const cloneIndexedSetter =
    <I, S, T, A, B>(l: AnIndexedSetter<I, S, T, A, B>): IndexedSetter<I, S, T, A, B> =>
    (i, f) =>
    (paFb) =>
        taintedDot(f)(fnPro)(l((idx) => untaintedDot(f)(fnPro)(i.indexed(paFb)(idx))));

export const mapped =
    <F, A, B>(f: Functor<F>): Setter<Get1<F, A>, Get1<F, B>, A, B> =>
    (s) =>
        sets(fnPro, fnPro, s)(f.map);

export const lifted =
    <M, A, B>(m: Monad<M>): Setter<Get1<M, A>, Get1<M, B>, A, B> =>
    (s) =>
        sets(fnPro, fnPro, s)(liftM(m));

export const contraMapped =
    <F, A, B>(f: Contravariant<F>): Setter<Get1<F, B>, Get1<F, A>, A, B> =>
    (s) =>
        sets(fnPro, fnPro, s)(f.contraMap);

export const argument =
    <P, A, B, R>(p: Profunctor<P>): Setter<Get2<P, B, R>, Get2<P, A, R>, A, B> =>
    (s) =>
        sets(fnPro, fnPro, s)(leftMap(p));

export const setting =
    <S, T, A, B>(l: (ab: (a: A) => B) => (s: S) => T): IndexPreservingSetter<S, T, A, B> =>
    <P, F>(f: Conjoined<P> & Settable<F>) =>
    (paFb: Get2<P, A, Get1<F, B>>) =>
        f.cotabulate((ws) =>
            f.pure(
                l((a) => f.untainted(f.coindex(paFb)(replace<Corep<P>>(f)(a)(ws))))(f.extract(ws)),
            ),
        );

export const set =
    <S, T, A, B>(l: ASetter<S, T, A, B>) =>
    (b: B): ((s: S) => T) =>
        l(() => b);

export const setSimple =
    <S, A>(l: ASetterSimple<S, A>) =>
    (a: A): ((s: S) => S) =>
        l(() => a);

export const setSome =
    <S, T, A, B>(l: ASetter<S, T, A, Option<B>>) =>
    (b: B): ((s: S) => T) =>
        set(l)(some(b));

export const setPass =
    <S, T, A, B>(l: ASetter<S, T, A, B>) =>
    (b: B) =>
    (s: S): [B, T] => [b, set(l)(b)(s)];

export const setSomePass =
    <S, T, A, B>(l: ASetter<S, T, A, Option<B>>) =>
    (b: B) =>
    (s: S): [B, T] => [b, set(l)(some(b))(s)];

export const addSetIndex =
    <S, T>(l: ASetter<S, T, number, number>) =>
    (n: number): ((s: S) => T) =>
        l((a) => a + n);

export const subSetIndex =
    <S, T>(l: ASetter<S, T, number, number>) =>
    (n: number): ((s: S) => T) =>
        l((a) => a - n);

export const mulSetIndex =
    <S, T>(l: ASetter<S, T, number, number>) =>
    (n: number): ((s: S) => T) =>
        l((a) => a * n);

export const divSetIndex =
    <S, T>(l: ASetter<S, T, number, number>) =>
    (n: number): ((s: S) => T) =>
        l((a) => Math.floor(a / n));

export const powSetIndex =
    <S, T>(l: ASetter<S, T, number, number>) =>
    (n: number): ((s: S) => T) =>
        l((a) => Math.pow(a, n));

export const orSetIndex =
    <S, T>(l: ASetter<S, T, boolean, boolean>) =>
    (n: boolean): ((s: S) => T) =>
        l((a) => a || n);

export const andSetIndex =
    <S, T>(l: ASetter<S, T, boolean, boolean>) =>
    (n: boolean): ((s: S) => T) =>
        l((a) => a && n);

export const iSet = <I, S, T, A, B>(
    l: AnIndexedSetter<I, S, T, A, B>,
): ((f: (i: I) => B) => (s: S) => T) => compose(l)(compose(constant));

/**
 * Builds
 *
 * - `f(id) == id`
 * - `compose(f(g))(f(h)) == f(compose(g)(h))`
 */
export const iSets =
    <I, S, T, A, B>(fn: (g: (i: I) => (a: A) => B) => (s: S) => T): IndexedSetter<I, S, T, A, B> =>
    <F, P>(i: Indexable<I, P>, f: Settable<F>): Over<P, F, S, T, A, B> =>
        sets(i, fnPro, f)<A, B, S, T>(fn as Fn<Get3<P, I, A, B>, Fn<S, T>>);

export const iReplace =
    <I, S, T, A, B>(l: AnIndexedSetter<I, S, T, A, B>) =>
    (f: (i: I) => B): ((s: S) => T) =>
        l((i) => () => f(i));

// for MonadState:

export const assign =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, B>) =>
    (b: B): Get1<M, []> =>
        modify(m)(set(l)(b));

export const modifying =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, B>) =>
    (f: (a: A) => B): Get1<M, []> =>
        modify(m)(l(f));

export const assignSome =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, Option<B>>) =>
    (b: B): Get1<M, []> =>
        modify(m)(setSome(l)(b));

export const addEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, number>) =>
    (a: number): Get1<M, []> =>
        modify(m)(addSetIndex(l)(a));

export const subEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, number>) =>
    (a: number): Get1<M, []> =>
        modify(m)(subSetIndex(l)(a));

export const mulEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, number>) =>
    (a: number): Get1<M, []> =>
        modify(m)(mulSetIndex(l)(a));

export const divEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, number>) =>
    (a: number): Get1<M, []> =>
        modify(m)(divSetIndex(l)(a));

export const powEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, number>) =>
    (a: number): Get1<M, []> =>
        modify(m)(powSetIndex(l)(a));

export const andEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, boolean>) =>
    (a: boolean): Get1<M, []> =>
        modify(m)(andSetIndex(l)(a));

export const orEqual =
    <S, M>(m: MonadState<S, M>) =>
    (l: ASetterSimple<S, boolean>) =>
    (a: boolean): Get1<M, []> =>
        modify(m)(orSetIndex(l)(a));

export const runAll =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, B>) =>
    (mb: Get1<M, B>): Get1<M, []> =>
        m.flatMap(assign(m)(l))(mb);

export const runAllPass =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, B>) =>
    (b: B): Get1<M, B> =>
        m.map(() => b)(m.flatMap(assign(m)(l))(m.pure(b)));

export const runAllSome =
    <S, M>(m: MonadState<S, M>) =>
    <A, B>(l: ASetter<S, S, A, Option<B>>) =>
    (b: B): Get1<M, B> =>
        m.map(() => b)(m.flatMap(assignSome(m)(l))(m.pure(b)));

export const combine =
    <A>(semi: SemiGroup<A>) =>
    <S, T>(l: ASetter<S, T, A, A>) =>
    (n: A): ((s: S) => T) =>
        l((a) => semi.combine(a, n));

export const runCombine =
    <S, M, A>(m: MonadState<S, M>, semi: SemiGroup<A>) =>
    (l: ASetterSimple<S, A>) =>
    (n: A): Get1<M, []> =>
        modify(m)(combine(semi)(l)(n));

export const iModifying =
    <S, M>(ms: MonadState<S, M>) =>
    <I, A, B>(l: AnIndexedSetter<I, S, S, A, B>) =>
    (f: (i: I) => (a: A) => B): Get1<M, []> =>
        modify(ms)(l(f));

export const iReplacing =
    <S, M>(ms: MonadState<S, M>) =>
    <I, A, B>(l: AnIndexedSetter<I, S, S, A, B>) =>
    (f: (i: I) => B): Get1<M, []> =>
        modify(ms)(iReplace(l)(f));

// for MonadWriter:

export const scribe =
    <T, M, S>(mw: MonadWriter<T, M>, m: Monoid<S>) =>
    <A, B>(l: ASetter<S, T, A, B>) =>
    (b: B): Get1<M, []> =>
        mw.tell(set(l)(b)(m.identity));

export const passing =
    <W, M>(mw: MonadWriter<W, M>) =>
    <U, V>(l: Setter<W, W, U, V>) =>
    <A>(m: Get1<M, [A, (u: U) => V]>): Get1<M, A> =>
        mw.pass(mw.map(([a, uv]: [A, (u: U) => V]) => [a, l(identitySettable)(uv)])(m));

export const iPassing =
    <W, M>(mw: MonadWriter<W, M>) =>
    <I, U, V>(l: AnIndexedSetter<I, W, W, U, V>) =>
    <A>(m: Get1<M, [A, (i: I) => (u: U) => V]>): Get1<M, A> =>
        mw.pass(mw.map(([a, iuv]: [A, (i: I) => (u: U) => V]): [A, (w: W) => W] => [a, l(iuv)])(m));

export const censoring =
    <W, M>(mw: MonadWriter<W, M>) =>
    <U, V>(l: Setter<W, W, U, V>) =>
    (uv: (u: U) => V): (<A>(uv: Get1<M, A>) => Get1<M, A>) =>
        censor(mw)(l(identitySettable)(uv));

export const iCensoring =
    <W, M>(mw: MonadWriter<W, M>) =>
    <I, U, V>(l: AnIndexedSetter<I, W, W, U, V>) =>
    (iuv: (i: I) => (u: U) => V): (<A>(uv: Get1<M, A>) => Get1<M, A>) =>
        censor(mw)(l(iuv));

// for MonadReader:

export const locally =
    <S, M>(mr: MonadReader<S, M>) =>
    <A, B>(l: ASetter<S, S, A, B>) =>
    (f: (a: A) => B): (<R>(mf: Get1<M, R>) => Get1<M, R>) =>
        mr.local(l(f));

export const iLocally =
    <S, M>(mr: MonadReader<S, M>) =>
    <I, A, B>(l: AnIndexedSetter<I, S, S, A, B>) =>
    (f: (i: I) => (a: A) => B): (<R>(mf: Get1<M, R>) => Get1<M, R>) =>
        mr.local(l(f));

// for Arrow:

export const assignA =
    <P>(arr: Arrow<P>) =>
    <S, T, A, B>(l: ASetter<S, T, A, B>) =>
    (p: Get2<P, S, B>): Get2<P, S, T> =>
        arr.compose(arr.arr(uncurry<Fn<B, T>, B, T>(id)))(fanOut(arr)(arr.arr(flip(set(l))))(p));
