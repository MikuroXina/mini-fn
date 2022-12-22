import { List, appendToHead, drop, empty, head, map as listMap, unCons } from "./list.js";
import { Option, isNone, map as optionMap } from "./option.js";

import type { Comonad1 } from "./type-class/comonad.js";
import type { Functor1 } from "./type-class/functor.js";

declare const zipperNominal: unique symbol;
export type ZipperHktKey = typeof zipperNominal;
export interface Zipper<T> {
    left: List<T>;
    current: T;
    right: List<T>;
}

export const extract = <T>(zipper: Zipper<T>): T => zipper.current;
export const top = <T>(zipper: Zipper<T>): [Option<T>, T, Option<T>] => [
    head(zipper.left),
    zipper.current,
    head(zipper.right),
];

export const left = <T>(zipper: Zipper<T>): Option<Zipper<T>> =>
    optionMap(
        ([l, ls]: [T, List<T>]): Zipper<T> => ({
            left: ls,
            current: l,
            right: appendToHead(zipper.current)(zipper.right),
        }),
    )(unCons(zipper.left));
export const right = <T>(zipper: Zipper<T>): Option<Zipper<T>> =>
    optionMap(
        ([r, rs]: [T, List<T>]): Zipper<T> => ({
            left: appendToHead(zipper.current)(zipper.left),
            current: r,
            right: rs,
        }),
    )(unCons(zipper.right));

export const iterateLeft = <T>(zipper: Zipper<T>): List<Zipper<T>> => {
    const inner =
        (z: Zipper<T>) =>
        (list: List<Zipper<T>>): List<Zipper<T>> => {
            const lAndLs = unCons(z.left);
            if (isNone(lAndLs)) {
                return appendToHead(z)(list);
            }
            const [l, ls] = lAndLs[1];
            return inner({
                left: ls,
                current: l,
                right: appendToHead(z.current)(z.right),
            })(appendToHead(z)(list));
        };
    return inner(zipper)(empty());
};
export const iterateRight = <T>(zipper: Zipper<T>): List<Zipper<T>> => {
    const inner =
        (z: Zipper<T>) =>
        (list: List<Zipper<T>>): List<Zipper<T>> => {
            const rAndRs = unCons(z.right);
            if (isNone(rAndRs)) {
                return appendToHead(z)(list);
            }
            const [r, rs] = rAndRs[1];
            return inner({
                left: appendToHead(z.current)(z.left),
                current: r,
                right: rs,
            })(appendToHead(z)(list));
        };
    return inner(zipper)(empty());
};

export const duplicate = <T>(zipper: Zipper<T>): Zipper<Zipper<T>> => ({
    left: drop(1)(iterateLeft(zipper)),
    current: zipper,
    right: drop(1)(iterateRight(zipper)),
});

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [zipperNominal]: Zipper<A1>;
    }
}

export const functor: Functor1<ZipperHktKey> = {
    map:
        <T, U>(fn: (t: T) => U) =>
        (zipper: Zipper<T>): Zipper<U> => ({
            left: listMap(fn)(zipper.left),
            current: fn(zipper.current),
            right: listMap(fn)(zipper.right),
        }),
};

export const comonad: Comonad1<ZipperHktKey> = {
    ...functor,
    extract,
    duplicate,
};
