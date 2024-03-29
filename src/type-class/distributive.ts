import type { Get1 } from "../hkt.ts";
import type { Functor } from "./functor.ts";
import type { Monad } from "./monad.ts";

export interface Distributive<G> extends Functor<G> {
    readonly distribute: <F>(
        functor: Functor<F>,
    ) => <A>(fga: Get1<F, Get1<G, A>>) => Get1<G, Get1<F, A>>;
}

export const collect =
    <G>(dist: Distributive<G>) =>
    <F>(functor: Functor<F>) =>
    <A, B>(f: (a: A) => Get1<G, B>) =>
    (fa: Get1<F, A>): Get1<G, Get1<F, B>> =>
        dist.distribute(functor)(functor.map(f)(fa));

export const distributeM =
    <G>(dist: Distributive<G>) =>
    <M>(monad: Monad<M>) =>
    <A>(mga: Get1<M, Get1<G, A>>): Get1<G, Get1<M, A>> =>
        dist.distribute(monad)(mga);

export const collectM =
    <G>(dist: Distributive<G>) =>
    <M>(monad: Monad<M>) =>
    <A, B>(f: (a: A) => Get1<G, B>) =>
    (fa: Get1<M, A>): Get1<G, Get1<M, B>> =>
        dist.distribute(monad)(monad.map(f)(fa));

export const contraverse =
    <G>(dist: Distributive<G>) =>
    <F>(functor: Functor<F>) =>
    <A, B>(f: (fa: Get1<F, A>) => B) =>
    (fga: Get1<F, Get1<G, A>>): Get1<G, B> =>
        dist.map(f)(dist.distribute(functor)(fga));

export const coMapM =
    <G>(dist: Distributive<G>) =>
    <M>(monad: Monad<M>) =>
    <A, B>(f: (ma: Get1<M, A>) => B) =>
    (mga: Get1<M, Get1<G, A>>): Get1<G, B> =>
        dist.map(f)(distributeM(dist)(monad)(mga));
