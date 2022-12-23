import type { Functor1, Functor2 } from "./type-class/functor.js";

import type { Comonad2 } from "./type-class/comonad.js";
import type { GetHktA1 } from "./hkt.js";

declare const storeNominal: unique symbol;
export type StoreHktKey = typeof storeNominal;
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

export const experiment =
    <F>(functor: Functor1<F>) =>
    <S>(mapper: (s: S) => GetHktA1<F, S>) =>
    <A>(store: Store<S, A>): GetHktA1<F, A> =>
        functor.map(store.accessor)(mapper(store.index));

declare module "./hkt.js" {
    interface HktDictA2<A1, A2> {
        [storeNominal]: Store<A1, A2>;
    }
}

export const functor: Functor2<StoreHktKey> = { map };

export const comonad: Comonad2<StoreHktKey> = { map, extract, duplicate };
