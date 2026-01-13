import { isNone, none, type Option, some } from "./option.js";
import { and, equal, type Ordering } from "./ordering.js";
import { fromCmp, type Ord } from "./type-class/ord.js";
import { fromPartialCmp, type PartialOrd } from "./type-class/partial-ord.js";

export type TupleN<T extends unknown[]> = {
    readonly [K in keyof T]: PartialOrd<T[K]>;
};

export const partialCmp =
    <T extends unknown[]>(
        orderDict: {
            readonly [K in keyof T]: PartialOrd<T[K]>;
        },
    ) =>
    (lhs: TupleN<T>, rhs: TupleN<T>): Option<Ordering> => {
        const len = Math.min(lhs.length, rhs.length);
        let result: Ordering = equal;
        for (let i = 0; i < len; i += 1) {
            const order = orderDict[i]?.partialCmp(lhs[i], rhs[i]);
            if (order === undefined || isNone(order)) {
                return none();
            }
            result = and(order[1])(result);
        }
        return some(result);
    };
export const partialOrd: <T extends unknown[]>(
    orderDict: {
        readonly [K in keyof T]: PartialOrd<T[K]>;
    },
) => PartialOrd<TupleN<T>> = fromPartialCmp(partialCmp);
export const cmp =
    <T extends unknown[]>(
        orderDict: {
            readonly [K in keyof T]: Ord<T[K]>;
        },
    ) =>
    (lhs: TupleN<T>, rhs: TupleN<T>): Ordering => {
        const len = Math.min(lhs.length, rhs.length);
        let result: Ordering = equal;
        for (let i = 0; i < len; i += 1) {
            const order = orderDict[i]?.cmp(lhs[i], rhs[i]);
            if (order !== undefined) {
                result = and(order)(result);
            }
        }
        return result;
    };
export const ord: <T extends unknown[]>(
    orderDict: {
        readonly [K in keyof T]: Ord<T[K]>;
    },
) => Ord<TupleN<T>> = fromCmp(cmp);
