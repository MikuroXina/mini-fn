/* eslint-disable no-console */

import type { Monad1 } from "./type-class/monad";

declare const catNominal: unique symbol;
export type CatHktKey = typeof catNominal;

export interface Cat<T> {
    readonly value: T;
    feed<U>(fn: (t: T) => U): Cat<U>;
}
export const cat = <T>(value: T): Cat<T> => ({
    value,
    feed: <U>(fn: (t: T) => U) => cat(fn(value)),
});

export const inspect =
    <T>(inspector: (t: T) => void) =>
    (t: T) => {
        inspector(t);
        return t;
    };
export const log = <T>(t: T) => inspect<T>(console.log)(t);
export const debug = <T>(t: T) => inspect<T>(console.debug)(t);
export const info = <T>(t: T) => inspect<T>(console.info)(t);
export const warn = <T>(t: T) => inspect<T>(console.warn)(t);
export const error = <T>(t: T) => inspect<T>(console.error)(t);
export const dir = <T>(t: T) => inspect<T>(console.dir)(t);
export const dirxml = <T>(t: T) => inspect<T>(console.dirxml)(t);
export const table = <T>(t: T) => inspect<T>(console.table)(t);

export const flatten = <T>(catCat: Cat<Cat<T>>): Cat<T> => catCat.value;

export const product =
    <A>(a: Cat<A>) =>
    <B>(b: Cat<B>): Cat<[A, B]> =>
        cat([a.value, b.value]);
export const map =
    <T, U>(fn: (t: T) => U) =>
    (catT: Cat<T>): Cat<U> =>
        catT.feed(fn);
export const flatMap =
    <T, U>(fn: (t: T) => Cat<U>) =>
    (catT: Cat<T>): Cat<U> =>
        flatten(map(fn)(catT));

declare module "./hkt" {
    interface HktDictA1<A1> {
        [catNominal]: Cat<A1>;
    }
}

export const monad: Monad1<CatHktKey> = {
    product,
    pure: cat,
    map,
    flatMap,
    apply:
        <T1, U1>(fn: Cat<(t: T1) => U1>) =>
        (t: Cat<T1>): Cat<U1> =>
            flatMap(t.feed)(fn),
};
