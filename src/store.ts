import { apply as applyFn } from "./func.js";
import type { Apply2Only, Apply3Only, Get1, Hkt1, Hkt2, Hkt3 } from "./hkt.js";
import type { IdentityHkt } from "./identity.js";
import type { ComonadStore } from "./store/comonad.js";
import type { Tuple } from "./tuple.js";
import type { Apply } from "./type-class/apply.js";
import { Comonad, extend as extendComonad } from "./type-class/comonad.js";
import type { Functor } from "./type-class/functor.js";
import type { Monoid } from "./type-class/monoid.js";
import type { Pure } from "./type-class/pure.js";

export interface StoreT<S, W, A> {
    readonly index: S;
    readonly accessor: Get1<W, (s: S) => A>;
}

export const newStoreT =
    <S, W, A>(accessor: Get1<W, (s: S) => A>) =>
    (index: S): StoreT<S, W, A> => ({ index, accessor });

export const intoTuple = <S, W, A>({
    index,
    accessor,
}: StoreT<S, W, A>): Tuple<Get1<W, (s: S) => A>, S> => [accessor, index];

export const pos = <S, W, A>({ index }: StoreT<S, W, A>): S => index;

export const seek =
    <S>(newPos: S) =>
    <W, A>({ accessor }: StoreT<S, W, A>): StoreT<S, W, A> =>
        newStoreT(accessor)(newPos);

export const seeks =
    <S>(modifier: (s: S) => S) =>
    <W, A>(store: StoreT<S, W, A>): StoreT<S, W, A> => ({
        ...store,
        index: modifier(store.index),
    });

export const peek =
    <W>(com: Comonad<W>) =>
    <S>(position: S) =>
    <A>(store: StoreT<S, W, A>): A =>
        com.extract(store.accessor)(position);

export const peeks =
    <W>(com: Comonad<W>) =>
    <S>(modifier: (s: S) => S) =>
    <A>(store: StoreT<S, W, A>): A =>
        com.extract(store.accessor)(modifier(store.index));

export const experimentW =
    <W, F>(com: Comonad<W>, functor: Functor<F>) =>
    <S>(modifier: (s: S) => Get1<F, S>) =>
    <A>(store: StoreT<S, W, A>): Get1<F, A> =>
        functor.map(com.extract(store.accessor))(modifier(store.index));

export const mapW =
    <W>(functor: Functor<W>) =>
    <T, U>(f: (t: T) => U) =>
    <S>(store: StoreT<S, W, T>): StoreT<S, W, U> => ({
        ...store,
        accessor: functor.map((accessor: (s: S) => T) => (position: S) => f(accessor(position)))(
            store.accessor,
        ),
    });
export const pureW =
    <S, W>(monoid: Monoid<S>, p: Pure<W>) =>
    <A>(a: A): StoreT<S, W, A> => ({
        index: monoid.identity,
        accessor: p.pure(() => a),
    });
export const applyW =
    <S, W>(monoid: Monoid<S>, app: Apply<W>) =>
    <A, B>(fn: StoreT<S, W, (t: A) => B>) =>
    (store: StoreT<S, W, A>): StoreT<S, W, B> => ({
        index: monoid.combine(fn.index, store.index),
        accessor: app.apply(app.map(applyFn<S>())(fn.accessor))(store.accessor),
    });

export const extractW =
    <W>(comonad: Comonad<W>) =>
    <S, A>({ accessor, index }: StoreT<S, W, A>): A =>
        comonad.extract(accessor)(index);
export const extendW =
    <W>(comonad: Comonad<W>) =>
    <S, A, B>(fn: (store: StoreT<S, W, A>) => B) =>
    (store: StoreT<S, W, A>): StoreT<S, W, B> => ({
        ...store,
        accessor: extendComonad<W>(comonad)(
            (accessor: Get1<W, (s: S) => A>) => (index: S) =>
                fn({
                    accessor,
                    index,
                }),
        )(store.accessor),
    });
export const duplicateW =
    <W>(comonad: Comonad<W>) =>
    <S, A>(store: StoreT<S, W, A>): StoreT<S, W, StoreT<S, W, A>> => ({
        ...store,
        accessor: extendComonad<W>(comonad)(newStoreT<S, W, A>)(store.accessor),
    });

export interface StoreTHkt extends Hkt3 {
    readonly type: StoreT<this["arg3"], this["arg2"], this["arg1"]>;
}

export const functorW = <S, W>(
    functor: Functor<W>,
): Functor<Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    map: mapW(functor),
});

export const comonadW = <S, W>(
    comonad: Comonad<W>,
): Comonad<Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    ...functorW(comonad),
    duplicate: duplicateW(comonad),
    extract: extractW(comonad),
});

export type Store<S, A> = StoreT<S, IdentityHkt, A>;

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

export const comonadStore = <S, W>(
    com: Comonad<W>,
): ComonadStore<S, Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    ...comonadW(com),
    pos,
    peek: peek(com),
});
