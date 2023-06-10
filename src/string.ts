import { type Ordering, equal, greater, less } from "./ordering.js";
import { type Ord, fromCmp } from "./type-class/ord.js";

export const cmp = (lhs: string, rhs: string): Ordering => {
    if (lhs === rhs) {
        return equal;
    }
    if (lhs < rhs) {
        return less;
    }
    return greater;
};
export const ord: Ord<string> = fromCmp(() => cmp)();
