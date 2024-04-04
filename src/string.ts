import type { Serialize } from "./serialize.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";

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

export const serialize: Serialize<string> = (v) => (ser) =>
    ser.serializeString(v);
