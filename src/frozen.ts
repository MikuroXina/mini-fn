import { Eq, PartialEq, fromEquality, fromPartialEquality } from "./type-class/eq.js";
import { Option, andThen, none, some } from "./option.js";
import { Ord, PartialOrd, fromCmp, fromPartialCmp } from "./type-class/ord.js";
import { Ordering, isEq, and as then } from "./ordering.js";

import type { Monad1 } from "./type-class/monad.js";
import { id } from "./func.js";

declare const frozenNominal: unique symbol;
export type FrozenHktKey = typeof frozenNominal;
export type Frozen<T> = T & {
    readonly [K in keyof T]: T[K] extends Frozen<infer I>
        ? I
        : T[K] extends () => unknown
        ? T[K]
        : T[K] extends object
        ? Frozen<T[K]>
        : T[K];
};

export const equality =
    <S>(equalityDict: { readonly [K in keyof S]: PartialEq<S[K]> }) =>
    (l: Readonly<S>, r: Readonly<S>): boolean =>
        Object.keys(equalityDict).every((key) => {
            if (Object.hasOwn(equalityDict, key)) {
                const castKey = key as keyof S;
                return equalityDict[castKey].eq(l[castKey], r[castKey]);
            }
            return true;
        });
export const partialEq = <S>(equalityDict: { readonly [K in keyof S]: PartialEq<S[K]> }) =>
    fromPartialEquality(equality(equalityDict));
export const eq = <S>(equalityDict: { readonly [K in keyof S]: Eq<S[K]> }) =>
    fromEquality(equality(equalityDict));
export const partialCmp =
    <S>(orderDict: { readonly [K in keyof S]: PartialOrd<S[K]> }) =>
    (l: Readonly<S>, r: Readonly<S>): Option<Ordering> =>
        Object.keys(orderDict)
            .map((key) => {
                if (Object.hasOwn(orderDict, key)) {
                    const castKey = key as keyof S;
                    return orderDict[castKey].partialCmp(l[castKey], r[castKey]);
                }
                return none();
            })
            .reduce((prev, curr) =>
                andThen((previous: Ordering) => (isEq(previous) ? curr : some(previous)))(prev),
            );
export const partialOrd = <S>(orderDict: { readonly [K in keyof S]: PartialOrd<S[K]> }) =>
    fromPartialCmp(partialCmp(orderDict));
export const cmp =
    <S>(orderDict: { readonly [K in keyof S]: Ord<S[K]> }) =>
    (l: Readonly<S>, r: Readonly<S>): Ordering =>
        Object.keys(orderDict)
            .map((key) => {
                if (Object.hasOwn(orderDict, key)) {
                    const castKey = key as keyof S;
                    return orderDict[castKey].cmp(l[castKey], r[castKey]);
                }
                throw new Error("`orderDict` must have comparator by own key");
            })
            .reduce((prev, curr) => then(curr)(prev));
export const ord = <S>(orderDict: { readonly [K in keyof S]: Ord<S[K]> }) =>
    fromCmp(cmp(orderDict));

export const freeze = <T>(x: T): Frozen<T> => x as Frozen<T>;

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [frozenNominal]: Frozen<A1>;
    }
}

export const product =
    <A, B>(fa: Frozen<A>) =>
    (fb: Frozen<B>): Frozen<[A, B]> =>
        freeze([fa, fb]);
export const pure = freeze;
export const map =
    <T, U>(fn: (t: T) => U) =>
    (ft: Frozen<T>): Frozen<U> =>
        freeze(fn(ft));
export const flatMap = id;
export const apply = map;

export const monad: Monad1<FrozenHktKey> = {
    product,
    pure,
    map,
    flatMap,
    apply,
};
