import { Option, isNone, none, map as optionMap, some } from "../option.js";
import {
    Zipper,
    duplicate as zipperDuplicate,
    extract as zipperExtract,
    map as zipperMap,
    top as zipperTop,
} from "../zipper.js";

import type { Comonad1 } from "src/type-class/comonad.js";
import type { Functor1 } from "src/type-class/functor.js";

declare const zipper2Nominal: unique symbol;
export type Zipper2HktKey = typeof zipper2Nominal;
export type Zipper2<T> = Zipper<Zipper<T>>;

export const map = <T, U>(fn: (t: T) => U): ((zipper: Zipper2<T>) => Zipper2<U>) =>
    zipperMap(zipperMap(fn));

export const top = <T>(
    zipper: Zipper2<T>,
): [
    [Option<T>, Option<T>, Option<T>],
    [Option<T>, T, Option<T>],
    [Option<T>, Option<T>, Option<T>],
] => {
    const flatten = (
        column: Option<[Option<T>, T, Option<T>]>,
    ): [Option<T>, Option<T>, Option<T>] => {
        if (isNone(column)) {
            return [none(), none(), none()];
        }
        return [column[1][0], some(column[1][1]), column[1][2]];
    };
    const [up, middle, down] = zipperTop(zipper);
    const upper = flatten(optionMap(zipperTop)(up));
    const downer = flatten(optionMap(zipperTop)(down));
    return [upper, zipperTop(middle), downer];
};

export const extract = <T>(zipper: Zipper2<T>): T => zipperExtract(zipperExtract(zipper));
export const duplicate = <T>(zipper: Zipper2<T>): Zipper2<Zipper2<T>> =>
    zipperDuplicate(zipperMap(zipperDuplicate)(zipper));

declare module "../hkt.js" {
    interface HktDictA1<A1> {
        [zipper2Nominal]: Zipper2<A1>;
    }
}

export const functor: Functor1<Zipper2HktKey> = { map };

export const comonad: Comonad1<Zipper2HktKey> = {
    ...functor,
    extract,
    duplicate,
};
