import type { Apply2Only, Hkt2 } from "./hkt.js";
import type { Applicative } from "./type-class/applicative.js";
import type { Bifunctor } from "./type-class/bifunctor.js";
import type { Functor } from "./type-class/functor.js";
import type { Monad } from "./type-class/monad.js";

export type Rec<K, V> = K extends string ? Readonly<Record<K, V>> : never;

export const pick =
    <const K extends string>(key: K) =>
    <const O extends Rec<string, unknown>>(
        obj: O,
    ): K extends keyof O ? Pick<O, K> : Record<string, never> =>
        (key in obj
            ? {
                  [key]: (obj as Record<K, unknown>)[key],
              }
            : {}) as K extends keyof O ? Pick<O, K> : Record<string, never>;

export const pickWith =
    <const K extends string>(predicate: (key: string) => key is K) =>
    <const O extends Record<string, unknown>>(obj: O): Pick<O, K> => {
        const res: Record<string, unknown> = {};
        for (const key in obj) {
            if (predicate(key)) {
            }
        }
        return res as Pick<O, K>;
    };

export const map =
    <K extends string, T, U>(fn: (t: T) => U) =>
    (obj: Record<K, T>): Rec<K, U> =>
        Object.fromEntries(Object.entries<T>(obj).map(([key, value]) => [key, fn(value)])) as Rec<
            K,
            U
        >;

export const pure =
    <const K extends string>(key: K) =>
    <T>(t: T): Rec<K, T> =>
        ({ [key]: t }) as Rec<K, T>;

export const apply =
    <K extends string, T, U>(fn: Rec<K, (t: T) => U>) =>
    (t: Rec<K, T>): Rec<K, U> =>
        Object.fromEntries(
            Object.entries<T>(t).map(([key, value]) => [key, fn[key as K](value)]),
        ) as Rec<K, U>;

export const flatten = <K extends string, T>(t: Record<K, Record<K, T>>): Rec<K, T> =>
    Object.values<Rec<K, T>>(t as Rec<K, Rec<K, T>>).reduce(
        (prev, curr) => ({
            ...prev,
            ...curr,
        }),
        {} as Rec<K, T>,
    );

export const flatMap =
    <K extends string, T, U>(fn: (t: T) => Rec<K, U>) =>
    (t: Rec<K, T>): Rec<K, U> =>
        flatten(map(fn)(t)) as Rec<K, U>;

export const biMap =
    <A, B>(first: (a: A) => B) =>
    <C, D>(second: (c: C) => D) =>
    (curr: Rec<A, C>): Rec<B, D> => {
        const res: Record<string, D> = {};
        for (const key in curr) {
            res[first(key as A) as string] = second(curr[key as A]);
        }
        return res as Rec<B, D>;
    };

export interface RecHkt extends Hkt2 {
    readonly type: Rec<this["arg2"], this["arg1"]>;
}

export const functor = <K extends string>(): Functor<Apply2Only<RecHkt, K>> => ({
    map,
});

export const applicative = <const K extends string>(
    key: K,
): Applicative<Apply2Only<RecHkt, K>> => ({
    pure: pure(key),
    map,
    apply,
});

export const monad = <const K extends string>(key: K): Monad<Apply2Only<RecHkt, K>> => ({
    ...applicative(key),
    flatMap,
});

export const bifunctor: Bifunctor<RecHkt> = { biMap };
