import { isNone, none, type Option, some } from "./option.ts";
import { and, equal, type Ordering } from "./ordering.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.ts";

export type TupleN<T extends unknown[]> = {
    readonly [K in keyof T]: PartialOrd<T[K]>;
};

export const partialCmp = <T extends unknown[]>(
    orderDict: {
        readonly [K in keyof T]: PartialOrd<T[K]>;
    },
) =>
(lhs: TupleN<T>, rhs: TupleN<T>): Option<Ordering> => {
    const len = Math.min(lhs.length, rhs.length);
    let result: Ordering = equal;
    for (let i = 0; i < len; i += 1) {
        const order = orderDict[i].partialCmp(lhs[i], rhs[i]);
        if (isNone(order)) {
            return none();
        }
        result = and(order[1])(result);
    }
    return some(result);
};
export const partialOrd = fromPartialCmp(partialCmp);
export const cmp = <T extends unknown[]>(
    orderDict: {
        readonly [K in keyof T]: Ord<T[K]>;
    },
) =>
(lhs: TupleN<T>, rhs: TupleN<T>): Ordering => {
    const len = Math.min(lhs.length, rhs.length);
    let result: Ordering = equal;
    for (let i = 0; i < len; i += 1) {
        result = and(orderDict[i].cmp(lhs[i], rhs[i]))(result);
    }
    return result;
};
export const ord = fromCmp(cmp);
