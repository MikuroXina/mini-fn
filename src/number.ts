import { Option, none, some } from "./option.js";
import { Ordering, equal, greater, less } from "./ordering.js";

import { fromPartialCmp } from "./type-class/ord.js";

export const partialCmp = (lhs: number, rhs: number): Option<Ordering> => {
    if (Number.isNaN(lhs) || Number.isNaN(rhs)) {
        return none();
    }
    if (lhs == rhs) {
        return some(equal);
    }
    if (lhs < rhs) {
        return some(less);
    }
    return some(greater);
};
export const partialOrd = fromPartialCmp(partialCmp);
