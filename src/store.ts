import type { Get1, Hkt1, Hkt2 } from "./hkt.js";

import type { Comonad } from "./type-class/comonad.js";
import type { Functor } from "./type-class/functor.js";

export interface Store<S, A> {
    readonly index: S;
    readonly accessor: (s: S) => A;
}

export const map =
    <A, B>(fn: (a: A) => B) =>
    <S>(store: Store<S, A>): Store<S, B> => ({
        ...store,
        accessor: (idx) => fn(store.accessor(idx)),
    });

export const extract = <S, A>(store: Store<S, A>): A => store.accessor(store.index);

export const duplicate = <S, A>(store: Store<S, A>): Store<S, Store<S, A>> => ({
    ...store,
    accessor: (idx) => ({ ...store, index: idx }),
});

export const extend =
    <S, A, B>(mapper: (sa: Store<S, A>) => B) =>
    (store: Store<S, A>): Store<S, B> => ({
        ...store,
        accessor: (idx) => mapper({ ...store, index: idx }),
    });

export const experiment =
    <F extends Hkt1>(functor: Functor<F>) =>
    <S>(mapper: (s: S) => Get1<F, S>) =>
    <A>(store: Store<S, A>): Get1<F, A> =>
        functor.map(store.accessor)(mapper(store.index));

export interface StoreHkt extends Hkt2 {
    readonly type: Store<this["arg2"], this["arg1"]>;
}

export const functor: Functor<StoreHkt> = { map };

export const comonad: Comonad<StoreHkt> = { map, extract, duplicate };
