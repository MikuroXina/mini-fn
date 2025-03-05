import { apply as applyFn } from "./func.ts";
import type { Apply2Only, Apply3Only, Get1, Hkt2, Hkt3 } from "./hkt.ts";
import type { IdentityHkt } from "./identity.ts";
import type { ComonadStore } from "./store/comonad.ts";
import type { Tuple } from "./tuple.ts";
import type { Apply } from "./type-class/apply.ts";
import { type Comonad, extend as extendComonad } from "./type-class/comonad.ts";
import type { Functor } from "./type-class/functor.ts";
import type { Monoid } from "./type-class/monoid.ts";
import type { Pure } from "./type-class/pure.ts";

/**
 * The store comonad transformer, the object holding the index `S` and accessor `(s: S) => A` on `W`.
 */
export type StoreT<S, W, A> = {
    readonly index: S;
    readonly accessor: Get1<W, (s: S) => A>;
};

/**
 * Creates a new `StoreT` from `accessor` and `index`.
 *
 * @param accessor - The accessor function wrapped in `W`.
 * @param index - The initial index value.
 * @returns The new store.
 */
export const newStoreT = <S, W, A>(accessor: Get1<W, (s: S) => A>) =>
(
    index: S,
): StoreT<S, W, A> => ({ index, accessor });

/**
 * Converts the store into a tuple of its fields.
 *
 * @param store - The store to be converted.
 * @returns The tuple of `store`'s fields.
 */
export const intoTuple = <S, W, A>({
    index,
    accessor,
}: StoreT<S, W, A>): Tuple<Get1<W, (s: S) => A>, S> => [accessor, index];

/**
 * Gets the position of the store.
 *
 * @param store - The source store.
 * @returns The index position of the store.
 */
export const pos = <S, W, A>({ index }: StoreT<S, W, A>): S => index;

/**
 * Seeks the store to the new position.
 *
 * @param newPos - The new position.
 * @param store - The store to be seeked.
 * @returns The seeked store.
 */
export const seek =
    <S>(newPos: S) => <W, A>({ accessor }: StoreT<S, W, A>): StoreT<S, W, A> =>
        newStoreT(accessor)(newPos);

/**
 * Seeks the store to the new position by modifying with `modifier`.
 *
 * @param modifier - The function to modify the position.
 * @param store - The store to be seeked.
 * @returns The seeked store.
 */
export const seeks =
    <S>(modifier: (s: S) => S) =>
    <W, A>(store: StoreT<S, W, A>): StoreT<S, W, A> => ({
        ...store,
        index: modifier(store.index),
    });

/**
 * Fetches the data at `position` from `store`.
 *
 * @param com - The instance of `Comonad` for `W`.
 * @param position - The position to fetch data from the store.
 * @param store - The store to be peeked.
 * @returns The fetched data.
 */
export const peek =
    <W>(com: Comonad<W>) =>
    <S>(position: S) =>
    <A>(store: StoreT<S, W, A>): A => com.extract(store.accessor)(position);

/**
 * Fetches the data from `store` at the position by modifying with `modifier`.
 *
 * @param com - The instance of `Comonad` for `W`.
 * @param position - The position to fetch data from the store.
 * @param store - The store to be peeked.
 * @returns The fetched data.
 */
export const peeks =
    <W>(com: Comonad<W>) =>
    <S>(modifier: (s: S) => S) =>
    <A>(store: StoreT<S, W, A>): A =>
        com.extract(store.accessor)(modifier(store.index));

/**
 * Fetches the data from `store` at the position by modifying with `modifier` on functor `F`.
 *
 * @param com - The instance of `Comonad` for `W`.
 * @param functor - The instance of `Functor` for `F`.
 * @param modifier - The function to modify the position on `F`.
 * @param store - The store to be fetched.
 * @returns The fetched data on `F`.
 */
export const experimentW =
    <W, F>(com: Comonad<W>, functor: Functor<F>) =>
    <S>(modifier: (s: S) => Get1<F, S>) =>
    <A>(store: StoreT<S, W, A>): Get1<F, A> =>
        functor.map(com.extract(store.accessor))(modifier(store.index));

/**
 * Maps data value of the store with `f`.
 *
 * @param functor - The instance of `Functor` for `W`.
 * @param f - The function which maps from `T`.
 * @param store - The store to be mapped.
 * @returns The mapped store.
 */
export const mapW =
    <W>(functor: Functor<W>) =>
    <T, U>(f: (t: T) => U) =>
    <S>(store: StoreT<S, W, T>): StoreT<S, W, U> => ({
        ...store,
        accessor: functor.map((accessor: (s: S) => T) => (position: S) =>
            f(accessor(position))
        )(
            store.accessor,
        ),
    });
/**
 * Creates a new store with the value `a`.
 *
 * @param monoid - The instance of `Monoid` for `S`.
 * @param p - The instance of `Pure` for `W`.
 * @param a - The value to be contained.
 * @returns The new store which returns only `a`.
 */
export const pureW =
    <S, W>(monoid: Monoid<S>, p: Pure<W>) => <A>(a: A): StoreT<S, W, A> => ({
        index: monoid.identity,
        accessor: p.pure(() => a),
    });
/**
 * Applies the function to the value over `StoreT`.
 *
 * @param monoid - The instance of `Monoid` for `S`.
 * @param app - The instance of `Apply` for `W`.
 * @param fn - The store which returns the function to apply.
 * @param store - The store to be applied.
 * @returns The applied store.
 */
export const applyW =
    <S, W>(monoid: Monoid<S>, app: Apply<W>) =>
    <A, B>(fn: StoreT<S, W, (t: A) => B>) =>
    (store: StoreT<S, W, A>): StoreT<S, W, B> => ({
        index: monoid.combine(fn.index, store.index),
        accessor: app.apply(app.map(applyFn<S>())(fn.accessor))(store.accessor),
    });

/**
 * Extracts the value on the current position of the store with comonad `W`.
 *
 * @param comonad - The instance of `Comonad` for `W`.
 * @param store - The store to be extracted.
 * @returns The value on the current position.
 */
export const extractW =
    <W>(comonad: Comonad<W>) =>
    <S, A>({ accessor, index }: StoreT<S, W, A>): A =>
        comonad.extract(accessor)(index);
/**
 * Extends the store with the extracting function `fn` with comonad `W`.
 *
 * @param comonad - The instance of `Comonad` for `W`.
 * @param fn - The function to extract the value from the store.
 * @param store - The store to be extended.
 * @returns The extended store.
 */
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
/**
 * Duplicates the store into `StoreT` with comonad `W`.
 *
 * @param comonad - The instance of `Comonad` for `W`.
 * @param store - The store to be duplicated.
 * @returns The duplicated store.
 */
export const duplicateW =
    <W>(comonad: Comonad<W>) =>
    <S, A>(store: StoreT<S, W, A>): StoreT<S, W, StoreT<S, W, A>> => ({
        ...store,
        accessor: extendComonad<W>(comonad)(newStoreT<S, W, A>)(store.accessor),
    });

export interface StoreTHkt extends Hkt3 {
    readonly type: StoreT<this["arg3"], this["arg2"], this["arg1"]>;
}

/**
 * Creates the instance of `Functor` for `StoreT` with the functor `W`.
 *
 * @param functor - The instance of `Functor` for `W`.
 * @returns The instance of `Functor` for `StoreT<S, W, _>`.
 */
export const functorW = <S, W>(
    functor: Functor<W>,
): Functor<Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    map: mapW(functor),
});

/**
 * Creates the instance of `Comonad` for `StoreT` with the functor `W`.
 *
 * @param functor - The instance of `Comonad` for `W`.
 * @returns The instance of `Comonad` for `StoreT<S, W, _>`.
 */
export const comonadW = <S, W>(
    comonad: Comonad<W>,
): Comonad<Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    ...functorW(comonad),
    duplicate: duplicateW(comonad),
    extract: extractW(comonad),
});

/**
 * The store comonad, the object holding the index `S` and accessor `(s: S) => A`.
 */
export type Store<S, A> = StoreT<S, IdentityHkt, A>;

/**
 * Creates a new `Store` from `accessor` and `index`.
 *
 * @param accessor - The accessor function.
 * @param index - The initial index value.
 * @returns The new store.
 */
export const newStore =
    <S, A>(accessor: (s: S) => A) => (index: S): Store<S, A> => ({
        index,
        accessor,
    });

/**
 * Maps data value of the store with `f`.
 *
 * @param f - The function which maps from `T`.
 * @param store - The store to be mapped.
 * @returns The mapped store.
 */
export const map =
    <A, B>(fn: (a: A) => B) => <S>(store: Store<S, A>): Store<S, B> => ({
        ...store,
        accessor: (idx) => fn(store.accessor(idx)),
    });

/**
 * Extracts the value on the current position of the store.
 *
 * @param store - The store to be extracted.
 * @returns The value on the current position.
 */
export const extract = <S, A>(store: Store<S, A>): A =>
    store.accessor(store.index);

/**
 * Duplicates the store into `StoreT`.
 *
 * @param store - The store to be duplicated.
 * @returns The duplicated store.
 */
export const duplicate = <S, A>(store: Store<S, A>): Store<S, Store<S, A>> => ({
    ...store,
    accessor: (idx) => ({ ...store, index: idx }),
});

/**
 * Extends the store with the extracting function `fn`.
 *
 * @param fn - The function to extract the value from the store.
 * @param store - The store to be extended.
 * @returns The extended store.
 */
export const extend =
    <S, A, B>(mapper: (sa: Store<S, A>) => B) =>
    (store: Store<S, A>): Store<S, B> => ({
        ...store,
        accessor: (idx) => mapper({ ...store, index: idx }),
    });

/**
 * Fetches the data from `store` at the position by modifying with `modifier` on functor `F`.
 *
 * @param functor - The instance of `Functor` for `F`.
 * @param modifier - The function to modify the position on `F`.
 * @param store - The store to be fetched.
 * @returns The fetched data on `F`.
 */
export const experiment =
    <F>(functor: Functor<F>) =>
    <S>(mapper: (s: S) => Get1<F, S>) =>
    <A>(store: Store<S, A>): Get1<F, A> =>
        functor.map(store.accessor)(mapper(store.index));

export interface StoreHkt extends Hkt2 {
    readonly type: Store<this["arg2"], this["arg1"]>;
}

/**
 * The instance of `Functor` for `Store<S, _>`.
 */
export const functor = <S>(): Functor<Apply2Only<StoreHkt, S>> => ({ map });

/**
 * The instance of `Comonad` for `Store<S, _>`.
 */
export const comonad = <S>(): Comonad<Apply2Only<StoreHkt, S>> => ({
    map,
    extract,
    duplicate,
});

/**
 * The instance of `ComonadStore` for `StoreT<S, W, _>`.
 */
export const comonadStore = <S, W>(
    com: Comonad<W>,
): ComonadStore<S, Apply3Only<Apply2Only<StoreTHkt, W>, S>> => ({
    ...comonadW(com),
    pos,
    peek: peek(com),
});
