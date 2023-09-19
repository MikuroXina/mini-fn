import type { Get1, Hkt2 } from "./hkt.js";
import { type IdentityHkt, monad as identityMonad } from "./identity.js";
import type { Category } from "./type-class/category.js";
import { flat, flatMap2, type Monad } from "./type-class/monad.js";

export interface Accessor<T, U, M = IdentityHkt> {
    readonly map: (source: T) => Get1<M, U>;
    readonly update: (source: T) => (part: Get1<M, U>) => Get1<M, T>;
    readonly env: Monad<M>;
}

export const identityM = <M, T>(m: Monad<M>): Accessor<T, T, M> => ({
    map: (source) => m.pure(source),
    update: () => (part) => part,
    env: m,
});
export const identity = <T>(): Accessor<T, T> => ({
    map: (source) => source,
    update: () => (part) => part,
    env: identityMonad,
});

export const concat =
    <U, V, M>(uvAccessor: Accessor<U, V, M>) =>
    <T>(tuAccessor: Accessor<T, U, M>): Accessor<T, V, M> => ({
        map: (source) => uvAccessor.env.flatMap(uvAccessor.map)(tuAccessor.map(source)),
        update: (source) => (part) =>
            tuAccessor.update(source)(
                flat(uvAccessor.env)(
                    uvAccessor.env.map((u: U) => uvAccessor.update(u)(part))(
                        tuAccessor.map(source),
                    ),
                ),
            ),
        env: uvAccessor.env,
    });

export const nthM =
    <M>(m: Monad<M>) =>
    <const I extends number, Tuple extends unknown[]>(index: I): Accessor<Tuple, Tuple[I], M> => ({
        map: (source) => m.pure(source[index]),
        update: (source) => (part) =>
            m.pure([...source.slice(0, index), part, ...source.slice(index + 1)] as Tuple),
        env: m,
    });
export const nth = nthM(identityMonad);

export const keyM =
    <M>(m: Monad<M>) =>
    <const K extends PropertyKey, O extends Record<K, unknown>>(k: K): Accessor<O, O[K], M> => ({
        map: (source) => m.pure(source[k]),
        update: (source) => (part) => m.pure({ ...source, [k]: part }),
        env: m,
    });
export const key = keyM(identityMonad);

export type ObjOrTuple<Keys> = Keys extends number[]
    ? unknown[]
    : Keys extends PropertyKey[]
    ? Record<Keys[number], unknown>
    : never;

export type Entries<O, K> = K extends [infer H, ...infer R]
    ? H extends keyof O
        ? R extends [PropertyKey]
            ? [[H, O[H]], ...Entries<O, R>]
            : [[H, O[H]]]
        : never
    : never;

export const keysM =
    <M>(m: Monad<M>) =>
    <const K extends PropertyKey[], O extends Record<K[number], unknown>>(
        ...keysToUpdate: K
    ): Accessor<O, Entries<O, K>, M> => ({
        map: (source) =>
            m.pure(keysToUpdate.map((k: K[number]) => [k, source[k]]) as Entries<O, K>),
        update: (source) =>
            m.map((parts: Entries<O, K>) => {
                const obj = { ...source } as Record<PropertyKey, unknown>;
                for (const [k, v] of parts) {
                    if (Object.hasOwn(obj, k)) {
                        obj[k] = v;
                    }
                }
                return obj as O;
            }),
        env: m,
    });
export const keys = keysM(identityMonad);

export interface AccessorHkt extends Hkt2 {
    readonly type: Accessor<this["arg2"], this["arg1"]>;
}

export const arrow: Category<AccessorHkt> = {
    identity,
    compose: concat,
};

export interface Optical<T, Root = T, M = IdentityHkt> {
    readonly get: () => Get1<M, T>;
    readonly set: (newValue: T) => Get1<M, Root>;
    readonly modify: (modifier: (t: T) => T) => Get1<M, Root>;
    readonly focus: <U>(accessor: Accessor<T, U, M>) => Optical<U, Root, M>;
    readonly env: Monad<M>;
    readonly root: Get1<M, Root>;
    readonly accessor: Accessor<Root, T, M>;
}

export const grow =
    <M, T>(data: Get1<M, T>) =>
    <U>(next: Accessor<T, U, M>) =>
    <Root>(optical: Optical<T, Root, M>): Optical<U, Root, M> => ({
        get: () => next.env.flatMap(next.map)(data),
        set: (newValue) =>
            flatMap2(next.env)(optical.accessor.update)(optical.root)(
                flatMap2(next.env)(next.update)(data)(next.env.pure(newValue)),
            ),
        modify: (modifier) =>
            flatMap2(next.env)(optical.accessor.update)(optical.root)(
                flatMap2(next.env)(next.update)(data)(
                    next.env.map(modifier)(next.env.flatMap(next.map)(data)),
                ),
            ),
        focus: <V>(accessor: Accessor<U, V, M>): Optical<V, Root, M> =>
            grow(next.env.flatMap(next.map)(data))(accessor)(grow(data)(next)(optical)),
        env: next.env,
        root: optical.root,
        accessor: concat(next)(optical.accessor),
    });

export const newOpticalM =
    <M>(m: Monad<M>) =>
    <T>(data: T): Optical<T, T, M> => ({
        get: () => m.pure(data),
        set: (newValue) => m.pure(newValue),
        modify: (modifier) => m.pure(modifier(data)),
        focus: (accessor) => grow(m.pure(data))(accessor)(newOpticalM(m)(data)),
        env: m,
        root: m.pure(data),
        accessor: identityM(m),
    });
export const newOptical = newOpticalM(identityMonad);
