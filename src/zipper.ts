import type { Serialize } from "./serialize.ts";
import type { Hkt1 } from "./hkt.ts";
import {
    appendToHead,
    drop,
    empty,
    head,
    type List,
    map as listMap,
    ord as listOrd,
    partialEq as listPartialEq,
    partialOrd as listPartialOrd,
    plus,
    reverse,
    serialize as listSerialize,
    singleton as listSingleton,
    unCons,
} from "./list.ts";
import {
    andThen,
    isNone,
    map as optionMap,
    type Option,
    unwrap,
} from "./option.ts";
import { andThen as thenWith, type Ordering } from "./ordering.ts";
import type { Comonad } from "./type-class/comonad.ts";
import { type Eq, fromEquality } from "./type-class/eq.ts";
import type { Functor } from "./type-class/functor.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    fromPartialEquality,
    type PartialEq,
} from "./type-class/partial-eq.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";

/**
 * The zipper represents the cursor of non-empty list.
 */
export interface Zipper<T> {
    /**
     * The left side of zipper, its order is reversed from the source list.
     */
    readonly left: List<T>;
    /**
     * The current element picked up.
     */
    readonly current: T;
    /**
     * The right side of zipper, its order is same as the source list.
     */
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
                listPartialOrd(order).partialCmp(
                    reverse(lhs.left),
                    reverse(rhs.left),
                ),
            ),
        );
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp =
    <T>(order: Ord<T>) => (lhs: Zipper<T>, rhs: Zipper<T>): Ordering =>
        thenWith(() => listOrd(order).cmp(lhs.right, rhs.right))(
            thenWith(() => order.cmp(lhs.current, rhs.current))(
                listOrd(order).cmp(reverse(lhs.left), reverse(rhs.left)),
            ),
        );
export const ord = fromCmp(cmp);

/**
 * Creates a new zipper with the value.
 *
 * @param current - The new value to be contained.
 * @returns The zipper with only one element.
 */
export const singleton = <T>(current: T): Zipper<T> => ({
    left: empty(),
    current,
    right: empty(),
});

/**
 * Creates a new zipper which picks up the first element from the list, or a `None` if it is an empty list.
 *
 * @param list - The source list.
 * @returns The new zipper, or a `None` if it is empty.
 */
export const fromList = <T>(list: List<T>): Option<Zipper<T>> =>
    optionMap(
        ([x, xs]: [T, List<T>]): Zipper<T> => ({
            left: empty(),
            current: x,
            right: xs,
        }),
    )(unCons(list));

/**
 * Converts the zipper into a list.
 *
 * @param zipper - The source zipper.
 * @returns The converted list.
 */
export const toList = <T>(zipper: Zipper<T>): List<T> =>
    plus(reverse(zipper.left))(
        plus(listSingleton(zipper.current))(zipper.right),
    );

/**
 * Gets the current picking element of the zipper.
 *
 * @param zipper - The zipper to be extracted.
 * @returns The current element.
 */
export const extract = <T>(zipper: Zipper<T>): T => zipper.current;
/**
 * Gets the top elements of lists in the zipper. It is useful for looking elements around the cursor.
 *
 * @param zipper - The source zipper.
 * @returns The tuple of the left adjacent, current and right adjacent of `zipper`.
 */
export const top = <T>(zipper: Zipper<T>): [Option<T>, T, Option<T>] => [
    head(zipper.left),
    zipper.current,
    head(zipper.right),
];

/**
 * Shifts the zipper cursor to the left, or returns `none()` if there is no element in the left list.
 *
 * @param zipper - The source zipper.
 * @returns The shifted zipper.
 */
export const left = <T>(zipper: Zipper<T>): Option<Zipper<T>> =>
    optionMap(
        ([l, ls]: [T, List<T>]): Zipper<T> => ({
            left: ls,
            current: l,
            right: appendToHead(zipper.current)(zipper.right),
        }),
    )(unCons(zipper.left));
/**
 * Shifts the zipper cursor to the right, or returns `none()` if there is no element in the right list.
 *
 * @param zipper - The source zipper.
 * @returns The shifted zipper.
 */
export const right = <T>(zipper: Zipper<T>): Option<Zipper<T>> =>
    optionMap(
        ([r, rs]: [T, List<T>]): Zipper<T> => ({
            left: appendToHead(zipper.current)(zipper.left),
            current: r,
            right: rs,
        }),
    )(unCons(zipper.right));

/**
 * Shifts the zipper cursor to the start.
 *
 * @param zipper - The source zipper.
 * @returns The shifted zipper.
 */
export const start = <T>(zipper: Zipper<T>): Zipper<T> =>
    unwrap(fromList(toList(zipper)));
/**
 * Shifts the zipper cursor to the end. If the source list is infinite, it will hang forever.
 *
 * @param zipper - The source zipper.
 * @returns The shifted zipper.
 */
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

/**
 * Makes the list of zipper which shifted to left one by one (including same as the source). It is useful for viewing all the left elements of the zipper.
 *
 * @param zipper - The source zipper.
 * @returns The list of zipper.
 */
export const iterateLeft = <T>(zipper: Zipper<T>): List<Zipper<T>> => {
    const inner =
        (z: Zipper<T>) => (list: List<Zipper<T>>): List<Zipper<T>> => {
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
/**
 * Makes the list of zipper which shifted to right one by one (including same as the source). It is useful for viewing all the right elements of the zipper.
 *
 * @param zipper - The source zipper.
 * @returns The list of zipper.
 */
export const iterateRight = <T>(zipper: Zipper<T>): List<Zipper<T>> => {
    const inner =
        (z: Zipper<T>) => (list: List<Zipper<T>>): List<Zipper<T>> => {
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

/**
 * Duplicates the zipper into zippers, iterating to shifted zipper to the left/right. It is useful for generating the patterns of convolution.
 *
 * @param zipper - The source zipper.
 * @returns The zipper having the shifted zippers.
 */
export const duplicate = <T>(zipper: Zipper<T>): Zipper<Zipper<T>> => ({
    left: drop(1)(iterateLeft(zipper)),
    current: zipper,
    right: drop(1)(iterateRight(zipper)),
});

/**
 * Maps elements of the zipper with `fn`.
 *
 * @param fn - The function to map from `T`.
 * @param zipper - The zipper to be mapped.
 * @returns The mapped zipper.
 */
export const map =
    <T, U>(fn: (t: T) => U) => (zipper: Zipper<T>): Zipper<U> => ({
        left: listMap(fn)(zipper.left),
        current: fn(zipper.current),
        right: listMap(fn)(zipper.right),
    });

export interface ZipperHkt extends Hkt1 {
    readonly type: Zipper<this["arg1"]>;
}

/**
 * The instance of `Functor` for `Zipper`.
 */
export const functor: Functor<ZipperHkt> = {
    map,
};

/**
 * The instance of `Comonad` for `Zipper`.
 */
export const comonad: Comonad<ZipperHkt> = {
    ...functor,
    extract,
    duplicate,
};

export const serialize =
    <T>(serializeT: Serialize<T>): Serialize<Zipper<T>> => (v) =>
        listSerialize(serializeT)(toList(v));
