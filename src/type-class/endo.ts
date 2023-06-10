import { compose } from "../func.js";
import type { Monoid } from "./monoid.js";
import { semiGroupSymbol } from "./semi-group.js";

export type Endo<T> = (t: T) => T;

export const monoid = <T>(): Monoid<Endo<T>> => ({
    identity: (x: T) => x,
    combine: (l, r) => compose(l)(r),
    [semiGroupSymbol]: true,
});
