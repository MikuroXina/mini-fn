import { Eq, fromEquality } from "./type-class/eq.js";
import {
    List,
    appendToHead,
    drop,
    empty,
    head,
    map as listMap,
    ord as listOrd,
    partialEq as listPartialEq,
    partialOrd as listPartialOrd,
    singleton as listSingleton,
    plus,
    reverse,
    unCons,
} from "./list.js";
import { Option, andThen, isNone, map as optionMap, unwrap } from "./option.js";
import { Ord, fromCmp } from "./type-class/ord.js";
import { Ordering, andThen as thenWith } from "./ordering.js";
import { PartialEq, fromPartialEquality } from "./type-class/partial-eq.js";
import { PartialOrd, fromPartialCmp } from "./type-class/partial-ord.js";

import type { Comonad1 } from "./type-class/comonad.js";
import type { Functor1 } from "./type-class/functor.js";

declare const zipperNominal: unique symbol;
export type ZipperHktKey = typeof zipperNominal;
export interface Zipper<T> {
    readonly left: List<T>;
    readonly current: T;
    readonly right: List<T>;
}

export const partialEquality =
    <T>(equalityT: PartialEq<T>) =>
    (aZipper: Zipper<T>, bZipper: Zipper<T>): boolean =>
        listPartialEq(equalityT).eq(aZipper.left, bZipper.left) &&
        equalityT.eq(aZipper.current, bZipper.current) &&
        listPartialEq(equalityT).eq(aZipper.right, bZipper.right);
export const partialEq = fromPartialEquality(partialEquality);
export const equality = <T>(equalityT: Eq<T>) => partialEquality(equalityT);
export const eq = fromEquality(equality);
export const partialCmp =
    <T>(order: PartialOrd<T>) =>
    (lhs: Zipper<T>, rhs: Zipper<T>): Option<Ordering> =>
        andThen(() => listPartialOrd(order).partialCmp(lhs.right, rhs.right))(
            andThen(() => order.partialCmp(lhs.current, rhs.current))(
                listPartialOrd(order).partialCmp(reverse(lhs.left), reverse(rhs.left)),
            ),
        );
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <T>(order: Ord<T>) =>
    (lhs: Zipper<T>, rhs: Zipper<T>): Ordering =>
        thenWith(() => listOrd(order).cmp(lhs.right, rhs.right))(
            thenWith(() => order.cmp(lhs.current, rhs.current))(
                listOrd(order).cmp(reverse(lhs.left), reverse(rhs.left)),
            ),
        );
export const ord = fromCmp(cmp);

export const singleton = <T>(current: T): Zipper<T> => ({ left: empty(), current, right: empty() });

export const fromList = <T>(list: List<T>): Option<Zipper<T>> =>
    optionMap(
        ([x, xs]: [T, List<T>]): Zipper<T> => ({
            left: empty(),
            current: x,
            right: xs,
        }),
    )(unCons(list));

export const toList = <T>(zipper: Zipper<T>): List<T> =>
    plus(reverse(zipper.left))(plus(listSingleton(zipper.current))(zipper.right));

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

export const start = <T>(zipper: Zipper<T>): Zipper<T> => unwrap(fromList(toList(zipper)));
export const end = <T>(zipper: Zipper<T>): Zipper<T> => {
    const endItemAndRest = unCons(reverse(zipper.right));
    if (isNone(endItemAndRest)) {
        return zipper;
    }
    const [endItem, rest] = endItemAndRest[1];
    return {
        left: plus(rest)(plus(listSingleton(zipper.current))(zipper.left)),
        current: endItem,
        right: empty(),
    };
};

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

export const map =
    <T, U>(fn: (t: T) => U) =>
    (zipper: Zipper<T>): Zipper<U> => ({
        left: listMap(fn)(zipper.left),
        current: fn(zipper.current),
        right: listMap(fn)(zipper.right),
    });

declare module "./hkt.js" {
    interface HktDictA1<A1> {
        [zipperNominal]: Zipper<A1>;
    }
}

export const functor: Functor1<ZipperHktKey> = {
    map,
};

export const comonad: Comonad1<ZipperHktKey> = {
    ...functor,
    extract,
    duplicate,
};
