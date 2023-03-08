import type { Get1 } from "../hkt.js";
import type { Comonad } from "../type-class/comonad.js";
import type { Functor } from "../type-class/functor.js";

export interface ComonadStore<S, W> extends Comonad<W> {
    readonly pos: <A>(store: Get1<W, A>) => S;
    readonly peek: (position: S) => <A>(store: Get1<W, A>) => A;
}

export const peeks =
    <S, W>(cs: ComonadStore<S, W>) =>
    (modifier: (position: S) => S) =>
    <A>(store: Get1<W, A>): A =>
        cs.peek(modifier(cs.pos(store)))(store);

export const seek =
    <S, W>(cs: ComonadStore<S, W>) =>
    (position: S) =>
    <A>(store: Get1<W, A>): Get1<W, A> =>
        cs.peek(position)(cs.duplicate(store));

export const seeks =
    <S, W>(cs: ComonadStore<S, W>) =>
    (modifier: (position: S) => S) =>
    <A>(store: Get1<W, A>): Get1<W, A> =>
        peeks(cs)(modifier)(cs.duplicate(store));

export const experiment =
    <S, W, F>(cs: ComonadStore<S, W>, functor: Functor<F>) =>
    (modifier: (position: S) => Get1<F, S>) =>
    <A>(store: Get1<W, A>): Get1<F, A> =>
        functor.map((position: S) => cs.peek(position)(store))(modifier(cs.pos(store)));
