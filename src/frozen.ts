import { id } from "./func.ts";
import type { Hkt1 } from "./hkt.ts";
import { andThen, none, type Option, some } from "./option.ts";
import { and as then, isEq, type Ordering } from "./ordering.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Monad } from "./type-class/monad.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";

/**
 * The frozen type makes `T` type `readonly` recursively.
 */
export type Frozen<T> =
    & T
    & {
        readonly [K in keyof T]: T[K] extends Frozen<infer I> ? I
            : T[K] extends () => unknown ? T[K]
            : T[K] extends object ? Frozen<T[K]>
            : T[K];
    };

export const partialEquality =
    <S>(equalityDict: { readonly [K in keyof S]: PartialEq<S[K]> }) =>
    (l: Frozen<S>, r: Frozen<S>): boolean =>
        Object.keys(equalityDict).every((key) => {
            if (Object.hasOwn(equalityDict, key)) {
                const castKey = key as keyof S;
                return equalityDict[castKey].eq(l[castKey], r[castKey]);
            }
            return true;
        });
export const partialEq: <S>(
    equalityDict: { readonly [K in keyof S]: PartialEq<S[K]> },
) => PartialEq<Frozen<S>> = fromPartialEquality(partialEquality);
export const equality =
    <S>(equalityDict: { readonly [K in keyof S]: Eq<S[K]> }) =>
    (l: Frozen<S>, r: Frozen<S>): boolean =>
        Object.keys(equalityDict).every((key) => {
            if (Object.hasOwn(equalityDict, key)) {
                const castKey = key as keyof S;
                return equalityDict[castKey].eq(l[castKey], r[castKey]);
            }
            return true;
        });
export const eq: <S>(
    equalityDict: { readonly [K in keyof S]: Eq<S[K]> },
) => Eq<Frozen<S>> = fromEquality(equality);
export const partialCmp =
    <S>(orderDict: { readonly [K in keyof S]: PartialOrd<S[K]> }) =>
    (l: Frozen<S>, r: Frozen<S>): Option<Ordering> =>
        Object.keys(orderDict)
            .map((key) => {
                if (Object.hasOwn(orderDict, key)) {
                    const castKey = key as keyof S;
                    return orderDict[castKey].partialCmp(
                        l[castKey],
                        r[castKey],
                    );
                }
                return none();
            })
            .reduce((prev, curr) =>
                andThen((
                    previous: Ordering,
                ) => (isEq(previous) ? curr : some(previous)))(prev)
            );
export const partialOrd: <S>(
    orderDict: { readonly [K in keyof S]: PartialOrd<S[K]> },
) => PartialOrd<Frozen<S>> = fromPartialCmp(partialCmp);
export const cmp =
    <S>(orderDict: { readonly [K in keyof S]: Ord<S[K]> }) =>
    (l: Frozen<S>, r: Frozen<S>): Ordering =>
        Object.keys(orderDict)
            .map((key) => {
                if (Object.hasOwn(orderDict, key)) {
                    const castKey = key as keyof S;
                    return orderDict[castKey].cmp(l[castKey], r[castKey]);
                }
                throw new Error("`orderDict` must have comparator by own key");
            })
            .reduce((prev, curr) => then(curr)(prev));
export const ord: <S>(
    orderDict: { readonly [K in keyof S]: Ord<S[K]> },
) => Ord<Frozen<S>> = fromCmp(cmp);

/**
 * Freeze the value by casting as a `Frozen`.
 *
 * @param x - The value to be converted.
 * @returns The frozen value.
 */
export const freeze = <T>(x: T): Frozen<T> => x as Frozen<T>;

export const product =
    <A, B>(fa: Frozen<A>) => (fb: Frozen<B>): Frozen<[A, B]> =>
        freeze([fa, fb]);
export const pure = freeze;
export const map = <T, U>(fn: (t: T) => U) => (ft: Frozen<T>): Frozen<U> =>
    freeze(fn(ft));
export const flatMap = id;
export const apply = map;

export interface FrozenHkt extends Hkt1 {
    readonly type: Frozen<this["arg1"]>;
}

/**
 * The instance of `Monad` for `Frozen`.
 */
export const monad: Monad<FrozenHkt> = {
    pure,
    map,
    flatMap,
    apply,
};
