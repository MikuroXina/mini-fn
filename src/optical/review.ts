import { absurd, monadReader } from "../func.js";
import type { Get1, Get2 } from "../hkt.js";
import type { IdentityHkt } from "../identity.js";
import type { Getter, Optic, OpticSimple } from "../optical.js";
import { type MonadReader, reader } from "../reader/monad.js";
import { gets, type MonadState } from "../state/monad.js";
import { tagged, type TaggedHkt, unTagged } from "../tagged.js";
import { type Bifunctor, first } from "../type-class/bifunctor.js";
import type { Choice } from "../type-class/choice.js";
import type { Functor } from "../type-class/functor.js";
import { fnPro, type Profunctor } from "../type-class/profunctor.js";
import { type Settable } from "../type-class/settable.js";
import { type Getting, to, view } from "./getting.js";

export type Review<T, B> = <P, F>(
    f: Choice<P> & Bifunctor<P> & Settable<F>,
) => OpticSimple<P, F, T, B>;

export type AReview<T, B> = OpticSimple<TaggedHkt, IdentityHkt, T, B>;

export const reviewing =
    <P, F>(b: Bifunctor<P>, f: Functor<F>) =>
    <S, T, A, B>(p: Optic<TaggedHkt, IdentityHkt, S, T, A, B>): OpticSimple<P, F, T, B> => {
        const mapper = (state: B) => unTagged(p(tagged(state)));
        return b.biMap(mapper)(f.map(mapper));
    };

export const unto =
    <P, F>(p: Profunctor<P>, b: Bifunctor<P>, f: Functor<F>) =>
    <S, T, A, B>(bt: (b: B) => T): Optic<P, F, S, T, A, B> =>
    (paFb: Get2<P, A, Get1<F, B>>): Get2<P, S, Get1<F, T>> =>
        first(b)(absurd)(p.diMap(absurd)(f.map(bt))(paFb));

export const un =
    <P, F>(p: Profunctor<P>, b: Bifunctor<P>, f: Functor<F>) =>
    <A, S>(l: Getting<A, S, A>): OpticSimple<P, F, A, S> =>
        unto(p, b, f)(view(monadReader<S>())(l));

export const re =
    <T, B>(p: AReview<T, B>): Getter<B, T> =>
    (f) =>
        to(fnPro, f)((b: B) => unTagged(p(tagged(b))));

// for MonadReader:

export const review =
    <B, M>(mr: MonadReader<B, M>) =>
    <T>(p: AReview<T, B>): Get1<M, T> =>
        reader(mr)((b) => unTagged(p(tagged(b))));

export const reviewSimple =
    <T, B>(p: AReview<T, B>) =>
    (b: B): T =>
        unTagged(p(tagged(b)));

export const reviews =
    <B, M>(mr: MonadReader<B, M>) =>
    <T>(p: AReview<T, B>) =>
    <R>(tr: (t: T) => R): Get1<M, R> =>
        reader(mr)((b) => tr(unTagged(p(tagged(b)))));

// for MonadState:

export const reuse =
    <B, M>(ms: MonadState<B, M>) =>
    <T>(p: AReview<T, B>): Get1<M, T> =>
        gets(ms)((b) => unTagged(p(tagged(b))));

export const reuses =
    <B, M>(ms: MonadState<B, M>) =>
    <T>(p: AReview<T, B>) =>
    <R>(tr: (t: T) => R): Get1<M, R> =>
        gets(ms)((b) => tr(unTagged(p(tagged(b)))));
