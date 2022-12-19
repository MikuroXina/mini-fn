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
