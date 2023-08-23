import { equal, greater, less, type Ordering } from "./ordering.js";
import { fromCmp, type Ord } from "./type-class/ord.js";

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
