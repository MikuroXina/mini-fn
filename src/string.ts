import type { Serialize } from "./serialize.ts";
import { equal, greater, less, type Ordering } from "./ordering.ts";
import { fromCmp, type Ord } from "./type-class/ord.ts";
import {
    type Deserialize,
    newVisitor,
    type Visitor,
    visitorMonad,
} from "./deserialize.ts";

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

export const visitor: Visitor<string> = newVisitor("string")({
    visitString: (v) => visitorMonad<string>().pure(v),
});

export const deserialize: Deserialize<string> = (de) =>
    de.deserializeString(visitor);
