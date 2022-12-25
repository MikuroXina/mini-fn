import { Ord, fromCmp } from "./type-class/ord.js";
import { Ordering, equal, greater, less } from "./ordering.js";

export const cmp = (lhs: string, rhs: string): Ordering => {
    if (lhs === rhs) {
        return equal;
    }
    if (lhs < rhs) {
        return less;
    }
    return greater;
};
export const ord: Ord<string> = fromCmp(cmp);
